import React, { useState, useRef, useEffect } from "react";
import "./editor.css";
import Tool from "../../components/tool/Tool";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";
import "react-image-crop/dist/ReactCrop.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  faCropSimple,
  faExpand,
  faFilter,
  faDownload,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function Editor() {
  const [imgSrc, setImgSrc] = useState(function () {
    try {
      const storedImage = localStorage.getItem("uploadedImage");
      return JSON.parse(storedImage || "");
    } catch (error) {
      console.log(error);
    }
  });
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  // 16 / 9 aspect ratio for landscape
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  // to provide UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  // filtering states
  const [grayscale, setGrayscale] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [blur, setBlur] = useState(false);

  function handleGrayscaleClick() {
    setGrayscale(!grayscale);
  }

  function handleContrastClick() {
    setContrast(!contrast);
  }

  function handleBlurClick() {
    setBlur(!blur);
  }

  // resize: set crop tool aspect ratio to 1 for square
  function handleResizeClick() {
    setAspect(1);
  }

  function handleDeleteImage() {
    // check if there exists an image
    if (!imgSrc) {
      toast.error("No image to be removed", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      return;
    }
    // reset state and useRef
    setImgSrc("");
    localStorage.removeItem("uploadedImage");
    previewCanvasRef.current?.remove();
    hiddenAnchorRef.current?.remove();
    imgRef.current?.remove();
    URL.revokeObjectURL(blobUrlRef.current);

    toast.success("Successfully deleted image", {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  }

  // upload image to be edited
  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  }

  // on image load set cropping tool active
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
      toast.success("Successfully uploaded image", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } else {
      toast.error("Failed to upload image", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  }

  // download edited image
  function onDownloadCropClick() {
    try {
      setIsLoading(true);
      // check if there exists an image to be saved/downloaded
      if (!previewCanvasRef.current) {
        toast.error("Upload and edit an image first", {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        throw new Error("Crop canvas does not exist");
      }

      previewCanvasRef.current.toBlob((blob) => {
        if (!blob) {
          throw new Error("Failed to create blob");
        }
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        blobUrlRef.current = URL.createObjectURL(blob);
        hiddenAnchorRef.current!.href = blobUrlRef.current;
        hiddenAnchorRef.current!.click();
        toast.success("Download Successful", {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      });
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }

  // save uploaded image in localstorage
  useEffect(
    function () {
      try {
        // save image to local storage
        // console.log(imgSrc);
        localStorage.setItem("uploadedImage", JSON.stringify(imgSrc));
      } catch (error) {
        console.log(error);
      }
    },
    [imgSrc]
  );

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
      }
    },
    100,
    [completedCrop]
  );

  return (
    <div className="editor__container">
      <div className="tool__column">
        <Tool
          toolName="Crop"
          iconName={faCropSimple}
          active={imgSrc ? true : false}
        />
        <Tool
          toolName="Resize"
          iconName={faExpand}
          handleClick={handleResizeClick}
          active={false}
        />
        <Tool
          toolName="Mono"
          iconName={faFilter}
          handleClick={handleGrayscaleClick}
          active={grayscale}
        />
        <Tool
          toolName="Sepia"
          iconName={faFilter}
          handleClick={handleContrastClick}
          active={contrast}
        />
        <Tool
          toolName="Blur"
          iconName={faFilter}
          handleClick={handleBlurClick}
          active={blur}
        />
      </div>

      <div className="image__container">
        <div className="Crop-Controls">
          <label htmlFor="upload">
            {!imgSrc ? "Upload Image" : "Replace Image"}
          </label>
          <h1>{imgSrc ? fileName : ""}</h1>
          <input
            id="upload"
            className="imgInput"
            type="file"
            accept="image/*"
            onChange={onSelectFile}
          />
        </div>
        {!!imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            // minWidth={400}
            minHeight={200}
          >
            <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} />
          </ReactCrop>
        )}

        {!!completedCrop && (
          <>
            <h1 className="preview__heading">{imgSrc ? "Preview" : ""}</h1>
            <div className="canvas__container">
              <canvas
                ref={previewCanvasRef}
                style={{
                  objectFit: "contain",
                  width: completedCrop.width,
                  height: completedCrop.height,
                  filter: grayscale
                    ? "grayscale(1)"
                    : contrast
                    ? "sepia(1)"
                    : blur
                    ? "blur(5px)"
                    : "none",
                }}
              />
            </div>
            <div>
              {/* <button onClick={onDownloadCropClick}>Download Crop</button> */}
              <a
                href="#hidden"
                ref={hiddenAnchorRef}
                download
                style={{
                  position: "absolute",
                  top: "-200vh",
                  visibility: "hidden",
                }}
              >
                Hidden download
              </a>
            </div>
          </>
        )}
      </div>
      <div className="tool__column">
        <Tool
          style={{ marginTop: "3rem" }}
          toolName={isLoading ? "Loading" : "Save"}
          iconName={faDownload}
          handleClick={onDownloadCropClick}
        />
        <Tool
          toolName="Delete Image"
          iconName={faTrash}
          handleClick={handleDeleteImage}
        />
      </div>
      <ToastContainer />
    </div>
  );
}
