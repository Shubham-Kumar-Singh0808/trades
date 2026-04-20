package com.pawfectfoods.trades.dto;

import java.time.Instant;

public record AuthResponse(
	String token,
	String tokenType,
	Instant expiresAt,
	boolean requiresPasswordSetup,
	String setupToken
) {
}