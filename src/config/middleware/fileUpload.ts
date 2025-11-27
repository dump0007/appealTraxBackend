import * as path from 'path';
import * as fs from 'fs';
import { UploadedFile } from 'express-fileupload';

// Use process.cwd() to get the project root, then navigate to assets/proceedings
const uploadsDir = path.join(process.cwd(), 'assets', 'proceedings');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file types
const allowedMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
];

const allowedExtensions = ['.pdf', '.png', '.jpeg', '.jpg', '.xlsx', '.xls'];

export function validateProceedingFile(file: UploadedFile): { valid: boolean; error?: string } {
    // Check file size (250 KB)
    if (file.size > 250 * 1024) {
        return { valid: false, error: 'File size exceeds 250 KB limit' };
    }

    // Check MIME type
    if (!allowedMimes.includes(file.mimetype)) {
        return { valid: false, error: 'Invalid file type. Only PDF, PNG, JPEG, JPG, and Excel files are allowed.' };
    }

    // Check extension
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        return { valid: false, error: 'Invalid file extension. Only PDF, PNG, JPEG, JPG, and Excel files are allowed.' };
    }

    return { valid: true };
}

export function saveProceedingFile(file: UploadedFile): Promise<string> {
    return new Promise((resolve, reject) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.name);
        const name = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${name}-${uniqueSuffix}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Move file to uploads directory
        file.mv(filepath, (err) => {
            if (err) {
                reject(new Error(`Failed to save file: ${err.message}`));
            } else {
                resolve(filename);
            }
        });
    });
}

export function getProceedingFilePath(filename: string): string {
    return path.join(uploadsDir, filename);
}

export function deleteProceedingFile(filename: string): void {
    const filepath = getProceedingFilePath(filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
}

