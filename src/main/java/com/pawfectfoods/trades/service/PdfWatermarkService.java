package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.error.BusinessException;
import com.pawfectfoods.trades.error.ErrorCode;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.util.Matrix;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class PdfWatermarkService {

    public byte[] applyWatermark(byte[] pdfBytes, String watermarkText) {
        try (PDDocument document = Loader.loadPDF(pdfBytes);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            for (PDPage page : document.getPages()) {
                try (PDPageContentStream contentStream = new PDPageContentStream(
                        document,
                        page,
                        PDPageContentStream.AppendMode.APPEND,
                        true,
                        true)) {

                    contentStream.setNonStrokingColor(new Color(150, 150, 150));
                    contentStream.beginText();
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 36);

                    float centerX = page.getMediaBox().getWidth() / 2;
                    float centerY = page.getMediaBox().getHeight() / 2;
                    contentStream.setTextMatrix(Matrix.getRotateInstance(Math.toRadians(45), centerX - 150, centerY));
                    contentStream.showText(watermarkText);
                    contentStream.endText();
                }
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            log.error("Failed to apply watermark", ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.FILE_STORAGE_ERROR,
                    "Failed to generate watermarked PDF");
        }
    }
}
