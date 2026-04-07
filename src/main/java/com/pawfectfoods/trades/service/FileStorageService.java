package com.pawfectfoods.trades.service;

import com.pawfectfoods.trades.error.BusinessException;
import com.pawfectfoods.trades.error.ErrorCode;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@Slf4j
public class FileStorageService {

    private final Path uploadDir;
    private final long maxFileSizeBytes;

    public FileStorageService(
            @Value("${app.file.upload-dir:uploads/trades}") String uploadDir,
            @Value("${app.file.max-size-bytes:5242880}") long maxFileSizeBytes) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
        this.maxFileSizeBytes = maxFileSizeBytes;
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException ex) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.FILE_STORAGE_ERROR,
                    "Unable to initialize upload directory");
        }
    }

    public String saveFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, "PDF file is required");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.FILE_TOO_LARGE,
                    "File exceeds max allowed size");
        }

        String original = file.getOriginalFilename() == null ? "trade.pdf" : file.getOriginalFilename();
        String lower = original.toLowerCase(Locale.ROOT);
        String contentType = file.getContentType();
        boolean pdfContentType = "application/pdf".equalsIgnoreCase(contentType);
        boolean pdfByName = lower.endsWith(".pdf");

        if (!pdfContentType && !pdfByName) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, ErrorCode.FILE_INVALID_TYPE,
                    "Only PDF files are allowed");
        }

        String sanitizedName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        String uniqueFileName = UUID.randomUUID() + "_" + sanitizedName;
        Path destination = uploadDir.resolve(uniqueFileName);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            return destination.toString();
        } catch (IOException ex) {
            log.error("Failed to store trade PDF", ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.FILE_STORAGE_ERROR,
                    "Failed to store file");
        }
    }

    public Resource getFile(String filePath) {
        try {
            Path path = Path.of(filePath).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) {
                throw new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "File not found");
            }
            return resource;
        } catch (IOException ex) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.FILE_STORAGE_ERROR,
                    "Failed to read file");
        }
    }

    public byte[] getFileBytes(String filePath) {
        try {
            Path path = Path.of(filePath).toAbsolutePath().normalize();
            if (!Files.exists(path)) {
                throw new BusinessException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "File not found");
            }
            return Files.readAllBytes(path);
        } catch (IOException ex) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.FILE_STORAGE_ERROR,
                    "Failed to read file bytes");
        }
    }
}
