package com.example.ecommerce.compliance.service.impl;

import com.example.ecommerce.modal.ComplianceSellerNote;
import com.example.ecommerce.modal.ComplianceSellerNoteRead;
import com.example.ecommerce.modal.Product;
import com.example.ecommerce.repository.ComplianceSellerNoteReadRepository;
import com.example.ecommerce.repository.ComplianceSellerNoteRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.SellerRepository;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

final class ComplianceSellerNoteAnalyticsSupport {

    private ComplianceSellerNoteAnalyticsSupport() {
    }

    static Map<Long, Boolean> resolveStateMap(
            Long sellerId,
            List<Long> noteIds,
            ComplianceSellerNoteReadRepository readRepository,
            java.util.function.Function<ComplianceSellerNoteRead, Boolean> stateExtractor
    ) {
        if (noteIds == null || noteIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Boolean> result = noteIds.stream()
                .collect(Collectors.toMap(id -> id, id -> false, (a, b) -> a, java.util.HashMap::new));
        readRepository.findBySeller_IdAndNote_IdIn(sellerId, noteIds)
                .forEach(entry -> result.put(entry.getNote().getId(), stateExtractor.apply(entry)));
        return result;
    }

    static Map<String, Object> buildNoteImpactSummary(
            ComplianceSellerNote note,
            ProductRepository productRepository,
            ComplianceSellerNoteReadRepository readRepository,
            SellerRepository sellerRepository
    ) {
        return buildImpactSummary(note, productRepository.findAll(), readRepository, sellerRepository);
    }

    static Map<String, Object> buildAnalyticsSummary(
            String noteType,
            LocalDate fromDate,
            LocalDate toDate,
            Integer minImpactedSellers,
            Set<String> allowedTypes,
            ComplianceSellerNoteRepository noteRepository,
            ComplianceSellerNoteReadRepository readRepository,
            SellerRepository sellerRepository,
            ProductRepository productRepository
    ) {
        String normalizedTypeCandidate = ComplianceSellerNoteValueSupport.normalizeNullable(noteType);
        if ("ALL".equals(normalizedTypeCandidate)) {
            normalizedTypeCandidate = null;
        }
        final String normalizedType = normalizedTypeCandidate;
        if (normalizedType != null) {
            ComplianceSellerNoteValueSupport.assertAllowed(normalizedType, allowedTypes, "Unsupported note type");
        }
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate cannot be after toDate");
        }
        int minImpactedSellersSafe = minImpactedSellers == null ? 0 : Math.max(minImpactedSellers, 0);

        List<ComplianceSellerNote> filteredNotes = noteRepository.findAll().stream()
                .filter(note -> normalizedType == null || normalizedType.equals(note.getNoteType()))
                .filter(note -> ComplianceSellerNoteValueSupport.isWithinAnalyticsPeriod(note, fromDate, toDate))
                .toList();

        List<ComplianceSellerNote> publishedNotes = filteredNotes.stream()
                .filter(note -> "PUBLISHED".equals(note.getStatus()))
                .toList();
        ImpactStats impactStats = resolveImpactStats(publishedNotes, readRepository);

        if (minImpactedSellersSafe > 0) {
            Set<Long> allowedPublishedNoteIds = impactStats.impactedSellersByNote().entrySet().stream()
                    .filter(entry -> entry.getValue() >= minImpactedSellersSafe)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toSet());

            publishedNotes = publishedNotes.stream()
                    .filter(note -> allowedPublishedNoteIds.contains(note.getId()))
                    .toList();
            impactStats = resolveImpactStats(publishedNotes, readRepository);

            Set<Long> allowedSet = allowedPublishedNoteIds;
            filteredNotes = filteredNotes.stream()
                    .filter(note -> !"PUBLISHED".equals(note.getStatus()) || allowedSet.contains(note.getId()))
                    .toList();
        }

        long sellerCount = sellerRepository.count();
        long denominator = sellerCount * publishedNotes.size();
        long acknowledgedCount = impactStats.readEntries().stream().filter(ComplianceSellerNoteRead::isAcknowledged).count();
        long readCount = impactStats.readEntries().stream().filter(ComplianceSellerNoteRead::isRead).count();
        double acknowledgementRate = denominator <= 0
                ? 0.0
                : ComplianceSellerNoteValueSupport.roundPercentage((acknowledgedCount * 100.0) / denominator);
        double readRate = denominator <= 0
                ? 0.0
                : ComplianceSellerNoteValueSupport.roundPercentage((readCount * 100.0) / denominator);

        List<Product> products = productRepository.findAll();
        final Map<Long, Long> impactedSellersByNoteFinal = impactStats.impactedSellersByNote();
        List<Map<String, Object>> impactTopNotes = publishedNotes.stream()
                .sorted(ComplianceSellerNoteValueSupport.noteComparator())
                .limit(8)
                .map(note -> {
                    Map<String, Object> impact = buildImpactSummary(note, products, readRepository, sellerRepository);
                    impact.put("noteId", note.getId());
                    impact.put("title", note.getTitle());
                    impact.put("noteType", note.getNoteType());
                    impact.put("priority", note.getPriority());
                    impact.put("impactedSellerCount", impactedSellersByNoteFinal.getOrDefault(note.getId(), 0L));
                    return impact;
                })
                .toList();

        Map<String, Long> byType = filteredNotes.stream()
                .collect(Collectors.groupingBy(ComplianceSellerNote::getNoteType, Collectors.counting()));
        Map<String, Long> byPriority = filteredNotes.stream()
                .collect(Collectors.groupingBy(ComplianceSellerNote::getPriority, Collectors.counting()));

        LinkedHashMap<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalNotes", filteredNotes.size());
        summary.put("draftCount", filteredNotes.stream().filter(note -> "DRAFT".equals(note.getStatus())).count());
        summary.put("publishedCount", publishedNotes.size());
        summary.put("archivedCount", filteredNotes.stream().filter(note -> "ARCHIVED".equals(note.getStatus())).count());
        summary.put("highPriorityCount", filteredNotes.stream()
                .filter(note -> "HIGH".equals(note.getPriority()) || "CRITICAL".equals(note.getPriority()))
                .count());
        summary.put("sellerCount", sellerCount);
        summary.put("readRatePercentage", readRate);
        summary.put("acknowledgementRatePercentage", acknowledgementRate);
        summary.put("byType", byType);
        summary.put("byPriority", byPriority);
        summary.put("impactTopNotes", impactTopNotes);
        return summary;
    }

    private static Map<String, Object> buildImpactSummary(
            ComplianceSellerNote note,
            List<Product> products,
            ComplianceSellerNoteReadRepository readRepository,
            SellerRepository sellerRepository
    ) {
        String normalizedCategory = ComplianceSellerNoteValueSupport.normalizeCategoryKey(note == null ? null : note.getAffectedCategory());
        List<Product> impactedProducts = (products == null ? List.<Product>of() : products).stream()
                .filter(product -> product != null && isProductImpacted(product, normalizedCategory))
                .sorted(Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        long acknowledgedCount = 0;
        long readCount = 0;
        long impactedSellerCount = 0;
        long sellerCount = sellerRepository.count();
        if (note != null && note.getId() != null) {
            List<ComplianceSellerNoteRead> entries = readRepository.findByNote_IdIn(List.of(note.getId()));
            acknowledgedCount = entries.stream().filter(ComplianceSellerNoteRead::isAcknowledged).count();
            readCount = entries.stream().filter(ComplianceSellerNoteRead::isRead).count();
            impactedSellerCount = entries.stream()
                    .map(entry -> entry.getSeller() == null ? null : entry.getSeller().getId())
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();
        }
        double acknowledgementRate = sellerCount <= 0
                ? 0.0
                : ComplianceSellerNoteValueSupport.roundPercentage((acknowledgedCount * 100.0) / sellerCount);
        double readRate = sellerCount <= 0
                ? 0.0
                : ComplianceSellerNoteValueSupport.roundPercentage((readCount * 100.0) / sellerCount);

        List<Map<String, Object>> topProducts = impactedProducts.stream()
                .limit(12)
                .map(product -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", product.getId());
                    item.put("title", product.getTitle());
                    item.put("uiCategoryKey", product.getUiCategoryKey());
                    item.put("subcategoryKey", product.getSubcategoryKey());
                    item.put("active", product.isActive());
                    return item;
                })
                .toList();

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("affectedCategory", note == null ? null : note.getAffectedCategory());
        response.put("impactedProductCount", impactedProducts.size());
        response.put("impactedProducts", topProducts);
        response.put("coverageScope", normalizedCategory == null ? "GLOBAL_OR_UNSPECIFIED" : "CATEGORY_FILTERED");
        response.put("acknowledgedCount", acknowledgedCount);
        response.put("impactedSellerCount", impactedSellerCount);
        response.put("acknowledgementRatePercentage", acknowledgementRate);
        response.put("readRatePercentage", readRate);
        return response;
    }

    private static boolean isProductImpacted(Product product, String normalizedCategory) {
        if (normalizedCategory == null) {
            return true;
        }
        String uiCategory = ComplianceSellerNoteValueSupport.normalizeCategoryKey(product.getUiCategoryKey());
        String subCategory = ComplianceSellerNoteValueSupport.normalizeCategoryKey(product.getSubcategoryKey());
        String legacyCategory = ComplianceSellerNoteValueSupport.normalizeCategoryKey(
                product.getCategory() == null ? null : product.getCategory().getCategoryId()
        );
        return normalizedCategory.equals(uiCategory)
                || normalizedCategory.equals(subCategory)
                || normalizedCategory.equals(legacyCategory);
    }

    private static ImpactStats resolveImpactStats(
            List<ComplianceSellerNote> publishedNotes,
            ComplianceSellerNoteReadRepository readRepository
    ) {
        List<Long> publishedNoteIds = publishedNotes.stream()
                .map(ComplianceSellerNote::getId)
                .filter(Objects::nonNull)
                .toList();
        List<ComplianceSellerNoteRead> readEntries = publishedNoteIds.isEmpty()
                ? List.of()
                : readRepository.findByNote_IdIn(publishedNoteIds);
        Map<Long, Long> impactedSellersByNote = readEntries.stream()
                .filter(entry -> entry.getNote() != null && entry.getSeller() != null)
                .collect(Collectors.groupingBy(
                        entry -> entry.getNote().getId(),
                        Collectors.collectingAndThen(
                                Collectors.mapping(entry -> entry.getSeller().getId(), Collectors.toSet()),
                                sellerIds -> (long) sellerIds.size()
                        )
                ));
        return new ImpactStats(readEntries, impactedSellersByNote);
    }

    private record ImpactStats(List<ComplianceSellerNoteRead> readEntries, Map<Long, Long> impactedSellersByNote) {
    }
}
