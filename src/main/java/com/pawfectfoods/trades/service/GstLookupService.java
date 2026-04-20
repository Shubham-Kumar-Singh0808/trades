package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.dto.GstLookupResponse;
import com.pawfectfoods.trades.error.BusinessException;
import com.pawfectfoods.trades.error.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriUtils;

@Service
public class GstLookupService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.gst-insights.base-url:https://gst-insights-api.p.rapidapi.com}")
    private String gstInsightsBaseUrl;

    @Value("${app.gst-insights.host:gst-insights-api.p.rapidapi.com}")
    private String gstInsightsHost;

    @Value("${app.gst-insights.key:061e275879msh423740fab9e5fa5p1fc889jsn6a362b71b020}")
    private String gstInsightsKey;

    public GstLookupResponse lookup(String gstNo) {
        String normalized = normalize(gstNo);
        if (!normalized.matches("^[0-9A-Z]{15}$")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.GST_INVALID,
                    "GST number must be 15 alphanumeric characters");
        }

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    buildUrl(normalized),
                    HttpMethod.GET,
                    new HttpEntity<>(buildHeaders()),
                    JsonNode.class);

            JsonNode body = response.getBody();
            if (response.getStatusCode().isError() || body == null || !body.path("success").asBoolean(false)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.GST_INVALID,
                        "Unable to fetch GST details for the provided GST number");
            }

            JsonNode data = body.path("data");
            if (data.isMissingNode() || data.isNull()) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.GST_INVALID,
                        "No GST details found for the provided GST number");
            }

            String gstNumber = readText(data, "gstNumber");
            if (!StringUtils.hasText(gstNumber)) {
                gstNumber = normalized;
            }

            String tradeName = readText(data, "tradeName");
            String legalName = readText(data, "legalName");
            String companyName = StringUtils.hasText(tradeName) ? tradeName : legalName;
            if (!StringUtils.hasText(companyName)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.GST_INVALID,
                        "GST lookup did not return company name");
            }

            String registeredAddress = buildAddress(data.path("address"));
            if (!StringUtils.hasText(registeredAddress)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.GST_INVALID,
                        "GST lookup did not return registered address");
            }

            String gstStatus = readText(data, "status");
            boolean gstActive = data.path("isActive").asBoolean(false);

            return new GstLookupResponse(
                    gstNumber.toUpperCase(Locale.ROOT),
                    companyName,
                    registeredAddress,
                    gstStatus,
                    gstActive);
        } catch (BusinessException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, ErrorCode.INTERNAL_SERVER_ERROR,
                    "GST lookup service is currently unavailable");
        }
    }

    private String buildUrl(String gstNo) {
        return gstInsightsBaseUrl + "/getAddressUsingGST/"
                + UriUtils.encodePathSegment(gstNo, StandardCharsets.UTF_8);
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-rapidapi-host", gstInsightsHost);
        headers.set("x-rapidapi-key", gstInsightsKey);
        return headers;
    }

    private String readText(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return "";
        }
        return value.asText("").trim();
    }

    private String buildAddress(JsonNode addressNode) {
        if (addressNode == null || addressNode.isMissingNode() || addressNode.isNull()) {
            return "";
        }

        List<String> parts = new ArrayList<>();
        addIfPresent(parts, readText(addressNode, "buildingNumber"));
        addIfPresent(parts, readText(addressNode, "buildingName"));
        addIfPresent(parts, readText(addressNode, "floorNumber"));
        addIfPresent(parts, readText(addressNode, "street"));
        addIfPresent(parts, readText(addressNode, "location"));
        addIfPresent(parts, readText(addressNode, "locality"));
        addIfPresent(parts, readText(addressNode, "district"));
        addIfPresent(parts, readText(addressNode, "stateCode"));
        addIfPresent(parts, readText(addressNode, "pincode"));

        return String.join(", ", parts);
    }

    private void addIfPresent(List<String> parts, String value) {
        if (StringUtils.hasText(value)) {
            parts.add(value);
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
