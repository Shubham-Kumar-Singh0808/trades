package com.pawfectfoods.trades.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.bootstrap.admin")
@Getter
@Setter
public class AppBootstrapProperties {
    private String email = "admin@pawfectfoods.com";
    private String password = "admin@pawfectfoods";
}
