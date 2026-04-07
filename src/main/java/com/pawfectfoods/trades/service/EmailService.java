package com.pawfectfoods.trades.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.verification.base-url}")
    private String verificationBaseUrl;

    @Value("${app.vendor.password-setup-url:http://localhost:4000/setup-password?token=}")
    private String vendorPasswordSetupUrl;

    @Value("${app.password.reset-url:http://localhost:4000/reset-password?token=}")
    private String passwordResetUrl;

    public void sendVerificationEmail(String toEmail, String token) {
        String verificationUrl = verificationBaseUrl + token;
        String body = "Click the link to verify your account: " + verificationUrl;
        sendSimpleEmail(toEmail, "Verify your account", body);
    }

    public void sendVendorActivationEmail(String toEmail, String name, String token) {
        String activationUrl = verificationBaseUrl + token;
        String htmlBody = buildVendorActivationHtml(name, activationUrl);
        sendHtmlEmail(toEmail, "Activate your PawfectFoods vendor account", htmlBody);
    }

    public void sendVendorPasswordSetupEmail(String toEmail, String name, String token) {
        String setupUrl = vendorPasswordSetupUrl + token;
        String htmlBody = buildVendorPasswordSetupHtml(name, setupUrl);
        sendHtmlEmail(toEmail, "Set your PawfectFoods vendor password", htmlBody);
    }

    public void sendExecutivePasswordSetupEmail(String toEmail, String name, String token) {
        String setupUrl = vendorPasswordSetupUrl + token;
        String htmlBody = buildExecutivePasswordSetupHtml(name, setupUrl);
        sendHtmlEmail(toEmail, "Set your PawfectFoods executive password", htmlBody);
    }

    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        String resetUrl = passwordResetUrl + token;
        String htmlBody = buildPasswordResetHtml(name, resetUrl);
        sendHtmlEmail(toEmail, "Reset your PawfectFoods password", htmlBody);
    }

    public void sendTradeCreatedNotification(
            List<String> recipients,
            String tradeId,
            String description,
            String mode,
            String detailsUrl) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }

        String subject = "New Trade Opportunity - " + tradeId;

        for (String recipient : recipients) {
            try {
                String htmlBody = buildTradeNotificationHtml(tradeId, description, mode, detailsUrl);
                sendHtmlEmail(recipient, subject, htmlBody);
            } catch (Exception ex) {
                log.warn("Failed to send trade notification to {}", recipient, ex);
            }
        }
    }

    private void sendSimpleEmail(String toEmail, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

        private void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
                try {
                        MimeMessage mimeMessage = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, StandardCharsets.UTF_8.name());
                        helper.setFrom(fromAddress);
                        helper.setTo(toEmail);
                        helper.setSubject(subject);
                        helper.setText(htmlBody, true);
                        mailSender.send(mimeMessage);
                } catch (Exception ex) {
                        log.warn("Failed to send HTML email to {}", toEmail, ex);
                }
        }

        private String buildVendorActivationHtml(String name, String activationUrl) {
                String safeName = name == null || name.isBlank() ? "Vendor" : name;
                return """
                                <html>
                                    <body style=\"margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;\">
                                        <table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 0;\">
                                            <tr>
                                                <td align=\"center\">
                                                    <table role=\"presentation\" width=\"640\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 14px 45px rgba(15,42,56,.14);\">
                                                        <tr>
                                                            <td style=\"padding:28px 34px;background:linear-gradient(120deg,#0f766e,#115e59);color:#fff;\">
                                                                <h2 style=\"margin:0;font-size:26px;\">PawfectFoods Vendor Portal</h2>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style=\"padding:30px 34px;color:#1f2937;\">
                                                                <p style=\"font-size:17px;margin:0 0 14px;\">Hi %s, thanks to register with PawfectFoods.</p>
                                                                <p style=\"font-size:15px;line-height:1.7;margin:0 0 22px;\">To activate your account, click on the button below.</p>
                                                                <p style=\"margin:0 0 26px;\">
                                                                    <a href=\"%s\" style=\"display:inline-block;padding:13px 24px;border-radius:999px;background:#0ea5a4;color:#fff;text-decoration:none;font-weight:700;\">Activate Account</a>
                                                                </p>
                                                                <p style=\"font-size:13px;line-height:1.6;color:#64748b;margin:0;\">If the button does not work, open this link:<br/><a href=\"%s\" style=\"color:#0f766e;\">%s</a></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </body>
                                </html>
                                """.formatted(safeName, activationUrl, activationUrl, activationUrl);
        }

        private String buildVendorPasswordSetupHtml(String name, String setupUrl) {
                String safeName = name == null || name.isBlank() ? "Vendor" : name;
                return """
                                <html>
                                    <body style=\"margin:0;padding:0;background:#f5f8ff;font-family:'Segoe UI',Arial,sans-serif;\">
                                        <table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 0;\">
                                            <tr>
                                                <td align=\"center\">
                                                    <table role=\"presentation\" width=\"640\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 14px 45px rgba(22,62,116,.14);\">
                                                        <tr>
                                                            <td style=\"padding:28px 34px;background:linear-gradient(120deg,#1d4ed8,#1e40af);color:#fff;\">
                                                                <h2 style=\"margin:0;font-size:26px;\">Welcome to PawfectFoods</h2>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style=\"padding:30px 34px;color:#1f2937;\">
                                                                <p style=\"font-size:17px;margin:0 0 14px;\">Hi %s, your vendor account has been created by the admin.</p>
                                                                <p style=\"font-size:15px;line-height:1.7;margin:0 0 22px;\">Click the button below to set your password and start using the portal.</p>
                                                                <p style=\"margin:0 0 26px;\">
                                                                    <a href=\"%s\" style=\"display:inline-block;padding:13px 24px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;\">Set Password</a>
                                                                </p>
                                                                <p style=\"font-size:13px;line-height:1.6;color:#64748b;margin:0;\">If the button does not work, open this link:<br/><a href=\"%s\" style=\"color:#1d4ed8;\">%s</a></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </body>
                                </html>
                                """.formatted(safeName, setupUrl, setupUrl, setupUrl);
        }

        private String buildExecutivePasswordSetupHtml(String name, String setupUrl) {
                String safeName = name == null || name.isBlank() ? "User" : name;
                return """
                                <html>
                                    <body style=\"margin:0;padding:0;background:#eef7ff;font-family:'Segoe UI',Arial,sans-serif;\">
                                        <table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 0;\">
                                            <tr><td align=\"center\">
                                                <table role=\"presentation\" width=\"640\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.12);\">
                                                    <tr><td style=\"padding:26px 32px;background:linear-gradient(120deg,#0f172a,#1e293b);color:#fff;\"><h2 style=\"margin:0;font-size:24px;\">PawfectFoods Executive Access</h2></td></tr>
                                                    <tr><td style=\"padding:28px 32px;color:#1f2937;\">
                                                        <p style=\"margin:0 0 12px;font-size:16px;\">Hi %s, your account has been created by admin.</p>
                                                        <p style=\"margin:0 0 18px;font-size:14px;line-height:1.7;\">Click below to set your password and access the portal.</p>
                                                        <p><a href=\"%s\" style=\"display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;\">Set Password</a></p>
                                                    </td></tr>
                                                </table>
                                            </td></tr>
                                        </table>
                                    </body>
                                </html>
                                """.formatted(safeName, setupUrl);
        }

        private String buildPasswordResetHtml(String name, String resetUrl) {
                String safeName = name == null || name.isBlank() ? "User" : name;
                return """
                                <html>
                                    <body style=\"margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;\">
                                        <table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 0;\">
                                            <tr><td align=\"center\">
                                                <table role=\"presentation\" width=\"640\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.10);\">
                                                    <tr><td style=\"padding:26px 32px;background:linear-gradient(120deg,#0891b2,#0e7490);color:#fff;\"><h2 style=\"margin:0;font-size:24px;\">Reset Password</h2></td></tr>
                                                    <tr><td style=\"padding:28px 32px;color:#1f2937;\">
                                                        <p style=\"margin:0 0 12px;font-size:16px;\">Hi %s, we received a password reset request.</p>
                                                        <p style=\"margin:0 0 18px;font-size:14px;line-height:1.7;\">Click the button below to set your new password.</p>
                                                        <p><a href=\"%s\" style=\"display:inline-block;background:#0e7490;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;\">Reset Password</a></p>
                                                    </td></tr>
                                                </table>
                                            </td></tr>
                                        </table>
                                    </body>
                                </html>
                                """.formatted(safeName, resetUrl);
        }

        private String buildTradeNotificationHtml(String tradeId, String description, String mode, String detailsUrl) {
                String safeDescription = description == null || description.isBlank() ? "No description provided" : description;
                String safeMode = mode == null || mode.isBlank() ? "N/A" : mode;
                return """
                                <html>
                                    <body style=\"margin:0;padding:0;background:#f3f7fb;font-family:'Segoe UI',Arial,sans-serif;\">
                                        <table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 0;\">
                                            <tr>
                                                <td align=\"center\">
                                                    <table role=\"presentation\" width=\"680\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,.12);\">
                                                        <tr>
                                                            <td style=\"padding:26px 32px;background:linear-gradient(120deg,#0f4c81,#0c6b58);color:#fff;\">
                                                                <h2 style=\"margin:0;font-size:25px;\">PawfectFoods Trade Notification</h2>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style=\"padding:28px 32px;color:#1f2937;\">
                                                                <p style=\"margin:0 0 12px;font-size:16px;\">Dear Partner,</p>
                                                                <p style=\"margin:0 0 16px;font-size:14px;line-height:1.7;\">A new trade opportunity has been published. Please review the details below and proceed with your response.</p>
                                                                <table role=\"presentation\" width=\"100%%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;margin:0 0 18px;\">
                                                                    <tr>
                                                                        <td style=\"padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;width:180px;\">Trade ID</td>
                                                                        <td style=\"padding:10px 12px;border:1px solid #e2e8f0;\">%s</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style=\"padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;\">Description</td>
                                                                        <td style=\"padding:10px 12px;border:1px solid #e2e8f0;\">%s</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style=\"padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;\">Mode</td>
                                                                        <td style=\"padding:10px 12px;border:1px solid #e2e8f0;\">%s</td>
                                                                    </tr>
                                                                </table>
                                                                <p style=\"margin:0 0 22px;\">
                                                                    <a href=\"%s\" style=\"display:inline-block;padding:12px 22px;border-radius:999px;background:#0f766e;color:#fff;text-decoration:none;font-weight:700;\">View Details and Place Your Bid</a>
                                                                </p>
                                                                <p style=\"margin:0;font-size:13px;line-height:1.7;color:#64748b;\">If the button does not work, use this link:<br/><a href=\"%s\" style=\"color:#0f4c81;\">%s</a></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </body>
                                </html>
                                """.formatted(tradeId, safeDescription, safeMode, detailsUrl, detailsUrl, detailsUrl);
        }
}
