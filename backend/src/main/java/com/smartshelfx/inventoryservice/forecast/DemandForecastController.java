package com.smartshelfx.inventoryservice.forecast;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/forecast")
public class DemandForecastController {

    private final DemandForecastService demandForecastService;

    public DemandForecastController(DemandForecastService demandForecastService) {
        this.demandForecastService = demandForecastService;
    }

    @GetMapping("/demand")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<DemandForecastItemResponse> demandForecast() {
        return demandForecastService.forecastForAllProducts();
    }
}
