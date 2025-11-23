import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import Button from './Button';

const WebcamCapture = ({ onCapture }) => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    const confirm = () => {
        // Resize to 512x512
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            // Draw image to cover 512x512 (center crop)
            const aspect = img.width / img.height;
            let drawWidth = 512;
            let drawHeight = 512;
            let offsetX = 0;
            let offsetY = 0;

            if (aspect > 1) {
                drawWidth = 512 * aspect;
                offsetX = -(drawWidth - 512) / 2;
            } else {
                drawHeight = 512 / aspect;
                offsetY = -(drawHeight - 512) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            canvas.toBlob((blob) => {
                onCapture(blob, canvas.toDataURL('image/jpeg'));
            }, 'image/jpeg', 0.8);
        };
        img.src = imgSrc;
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-[300px] h-[300px] rounded-full overflow-hidden border-4 border-indigo-600 bg-black">
                {imgSrc ? (
                    <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user", aspectRatio: 1 }}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className="flex gap-2">
                {imgSrc ? (
                    <>
                        <Button onClick={retake} variant="outline" className="w-32">TEKRAR</Button>
                        <Button onClick={confirm} variant="green" className="w-32">ONAYLA</Button>
                    </>
                ) : (
                    <Button onClick={capture} variant="blue">FOTOĞRAF ÇEK</Button>
                )}
            </div>
        </div>
    );
};

export default WebcamCapture;
