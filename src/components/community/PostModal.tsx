"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  Avatar,
  IconButton,
} from "@mui/material";
import { useFormik, FormikHelpers } from "formik";
import * as yup from "yup";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import axios from "axios";
import { useAuth } from "@/contexts/auth.context";
import { createClient } from "@/supabase/client";

interface FormValues {
  postContent: string;
}

const validationSchema = yup.object({
  postContent: yup.string().required("내용을 입력해 주세요"),
});

interface PostModalProps {
  open: boolean;
  handleClose: () => void;
  addPost: (post: any) => void; // post의 타입도 정의 가능하다면 추가해 주세요
}

const PostModal: React.FC<PostModalProps> = ({ open, handleClose, addPost }) => {
  const { isLoggedIn, me } = useAuth();
  const [profileImage, setProfileImage] = useState<string>(
    "/images/profile-placeholder.png"
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const supabase = createClient();

  const formik = useFormik<FormValues>({
    initialValues: {
      postContent: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }: FormikHelpers<FormValues>) => {
      if (isLoggedIn) {
        try {
          let imageUrl = null;

          if (selectedFile) {
            // 이미지 파일 크기 및 유형 검사
            const fileSizeKB = selectedFile.size / 1024;
            const fileType = selectedFile.type;
            if (fileSizeKB > 700) {
              alert("이미지 파일 크기는 700KB를 초과할 수 없습니다.");
              setSubmitting(false);
              return;
            }
            if (!["image/png", "image/jpeg"].includes(fileType)) {
              alert("PNG 및 JPG/JPEG 이미지 파일만 업로드할 수 있습니다.");
              setSubmitting(false);
              return;
            }

            // Supabase 스토리지에 이미지 업로드
            const { data, error } = await supabase.storage
              .from("community-post-image")
              .upload(`public/${selectedFile.name}`, selectedFile);

            if (error) {
              console.error("Error uploading image:", error);
              setSubmitting(false);
              return;
            }

            imageUrl = supabase.storage
              .from("community-post-image")
              .getPublicUrl(`public/${selectedFile.name}`).data.publicUrl;
          }

          const response = await axios.post("/api/auth/post", {
            postContent: values.postContent,
            profileImage,
            image: imageUrl,
            user_id: me?.id,
          });

          if (response.status === 200) {
            addPost(response.data[0]);
            handleClose();
            alert("게시글이 작성되었습니다!");
          } else {
            console.error("Error:", response.data.error);
          }
        } catch (error) {
          console.error("Error submitting the form", error);
        }
      } else {
        console.warn("로그인이 필요합니다.");
      }
      setSubmitting(false);
    },
  });

  useEffect(() => {
    formik.resetForm();
    setSelectedImage(null);
    setSelectedFile(null);
  }, [open]);

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    formik.handleChange(event);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(URL.createObjectURL(file));
      setSelectedFile(file);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-[600px]"
        style={{ minHeight: "600px" }}
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={handleClose} className="text-gray-500">
              취소
            </Button>
            <Button
              type="submit"
              className={`py-1 px-4 rounded ${
                formik.values.postContent && isLoggedIn
                  ? "text-blue-500"
                  : "text-gray-400"
              }`}
              disabled={!formik.values.postContent || !isLoggedIn}
            >
              게시
            </Button>
          </div>
          <div className="flex items-center">
            <Avatar
              src={profileImage}
              alt="프로필"
              className="w-10 h-10 mr-2"
            />
            {isLoggedIn ? (
              <div className="text-gray-500">{me?.email}</div>
            ) : (
              <div className="text-red-500">로그인이 필요합니다.</div>
            )}
          </div>
          <div className="border border-gray-300 rounded-lg p-4 space-y-4">
            <div className="flex items-center">
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="file-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="file-upload">
                <IconButton component="span">
                  <PhotoCamera />
                </IconButton>
                <span className="ml-2 text-gray-500">이미지 추가</span>
              </label>
            </div>
            {selectedImage && (
              <div className="flex justify-center mb-4">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-h-40 rounded-lg"
                />
              </div>
            )}
            <TextField
              fullWidth
              id="postContent"
              name="postContent"
              placeholder="나누고 싶은 생각을 공유해 보세요!"
              multiline
              rows={6}
              value={formik.values.postContent}
              onChange={handleDescriptionChange}
              InputProps={{
                disableUnderline: true,
              }}
            />
          </div>
        </form>
      </Box>
    </Modal>
  );
};

export default PostModal;
