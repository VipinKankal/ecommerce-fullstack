package com.example.ecommerce.catalog.service;


import com.example.ecommerce.modal.Home;
import com.example.ecommerce.modal.HomeCategory;

import java.util.List;

public interface HomeService {
    public Home createHomePageDate(List<HomeCategory>allCategories);
}




