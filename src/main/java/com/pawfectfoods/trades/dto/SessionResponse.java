package com.pawfectfoods.trades.dto;

import java.util.Set;

public record SessionResponse(
	String email,
	String name,
	String mobileNo,
	String companyName,
	Set<String> roles
) {
}
