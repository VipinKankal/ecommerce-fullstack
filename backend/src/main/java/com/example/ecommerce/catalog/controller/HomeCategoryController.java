package com.example.ecommerce.catalog.controller;

import com.example.ecommerce.modal.Home;
import com.example.ecommerce.modal.HomeCategory;
import com.example.ecommerce.catalog.service.HomeCategoryService;
import com.example.ecommerce.catalog.service.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class HomeCategoryController {
    private final HomeCategoryService homeCategoryService;
    private final HomeService homeService;

    @PostMapping("/home/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Home> createHomeCategory(
            @RequestBody List<HomeCategory> homeCategories
    ){
        List<HomeCategory> categories = homeCategoryService.createCategories(homeCategories);
        Home home = homeService.createHomePageDate(categories);
        return new ResponseEntity<>(home, HttpStatus.ACCEPTED);
    }

    @GetMapping("/admin/home-category")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HomeCategory>>getHomeCategory(){
    List<HomeCategory> categories = homeCategoryService.getAllHomeCategories();
    return ResponseEntity.ok(categories);
    }

    @PatchMapping("/admin/home-category/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HomeCategory>updateHomeCategory(
            @PathVariable Long id,
            @RequestBody HomeCategory homeCategory
    ) throws Exception {
        HomeCategory updatedCategory = homeCategoryService.updateHomeCategory(homeCategory,id);
        return ResponseEntity.ok(updatedCategory);
    }

}




