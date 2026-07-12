"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, RotateCw, Move, Check, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProfilePictureCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
}

export function ProfilePictureCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: ProfilePictureCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve("");
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, "image/jpeg");
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedImageUrl = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onCropComplete(croppedImageUrl);
      onOpenChange(false);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image. Please try again.");
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[100]"
        className="z-[100] max-h-[95dvh] w-full max-w-2xl overflow-hidden p-0"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Edit Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[400px] bg-gray-900 overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="round"
            showGrid={true}
          />
        </div>
        <div className="px-6 py-4 space-y-4 bg-gray-50">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Zoom</label>
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => onZoomChange(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">
                  Rotation
                </label>
              </div>
              <span className="text-xs text-gray-500">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={(value) => onRotationChange(value[0])}
              min={-180}
              max={180}
              step={1}
              className="w-full"
            />
          </div>

          {/* Position Control */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                Position (drag to align)
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Drag the image to adjust its position within the circle
            </p>
          </div>
        </div>
        <DialogFooter className="flex flex-row flex-nowrap items-center gap-2 px-4 py-4 sm:justify-end sm:px-6 sm:pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="h-9 min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-4 sm:text-sm"
          >
            <X className="mr-1.5 h-4 w-4 shrink-0" />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-4 sm:text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="h-9 min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-4 sm:text-sm"
          >
            <Check className="mr-1.5 h-4 w-4 shrink-0" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

