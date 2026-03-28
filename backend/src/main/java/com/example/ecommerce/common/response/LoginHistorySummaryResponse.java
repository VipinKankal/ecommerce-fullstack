package com.example.ecommerce.common.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class LoginHistorySummaryResponse {
    private int activeDeviceCount;
    private List<LoginHistoryEntryResponse> loginHistory = new ArrayList<>();
}
