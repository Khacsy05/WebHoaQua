import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cấu hình chìa khóa kết nối Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Không tìm thấy file ảnh' }, { status: 400 });
        }

        // Chuyển đổi File sang dạng Buffer để đẩy lên Cloudinary
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Tiến hành upload lên mây Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'fruit-shop-products' }, // Tự động tạo thư mục này trên Cloudinary
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        // Trả về cái Link ảnh tuyệt đối (Dạng https://res.cloudinary.com/...)
        return NextResponse.json({ url: uploadResult.secure_url });

    } catch (error: any) {
        console.error('Lỗi upload Cloudinary:', error);
        return NextResponse.json({ error: 'Upload ảnh thất bại' }, { status: 500 });
    }
}