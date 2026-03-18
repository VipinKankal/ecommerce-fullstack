export const uploadToCloudinary = async (pics: File) => {
  const cloud_name = "dlrxvn9hp"; 
  const upload_preset = "e-commerce";

  if (pics) {
    const data = new FormData();
    data.append("file", pics);
    data.append("upload_preset", upload_preset);
    data.append("cloud_name", cloud_name);

    // FIXED: Removed '/demo/' and used the cloud_name variable correctly
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );
    
    const fileData = await res.json();
    
    if (fileData.url) {
      return fileData.url.toString();
    } else {
      throw new Error("Upload failed: " + fileData.error?.message);
    }
  }
};
