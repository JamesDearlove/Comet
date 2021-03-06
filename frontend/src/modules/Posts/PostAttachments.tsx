import React, { useState } from "react";

import Button from "@material-ui/core/Button";

import firebase from "firebase/app";
import { useSnackbar } from "notistack";
import { Typography } from "@material-ui/core";

interface PostingMethodProps {
  disabled: boolean;
  post: firebase.firestore.DocumentData;
  setPost: React.Dispatch<
    React.SetStateAction<firebase.firestore.DocumentData | undefined>
  >;
}

const PostingMethod = ({ disabled, post, setPost }: PostingMethodProps) => {
  const [selectedFile, setSelectedFile] = useState<File>();
  const { enqueueSnackbar } = useSnackbar();

  const uploadFile = async () => {
    // Custom random generator for user files
    const fileName = Math.random().toString(36).substr(2, 9);
    const userUID = firebase.auth().currentUser?.uid;

    if (userUID && selectedFile) {
      const storageRef = firebase
        .storage()
        .ref("attachments")
        .child(userUID)
        .child(fileName);
      const metadata = {
        customMetadata: {
          fileName: selectedFile.name,
        },
      };

      // TODO: Loading indicator for uploading file

      try {
        const upload = await storageRef.put(selectedFile, metadata);
        enqueueSnackbar(`${selectedFile.name} was uploaded successfully.`, {
          variant: "success",
        });
        setPost({
          ...post,
          attachments: [...(post.attachments || []), upload.ref.fullPath],
        });
      } catch (error) {
        enqueueSnackbar(`Unable to upload ${selectedFile.name}. ${error}`, {
          variant: "error",
        });
      }
    }
  };

  const onFileAttached = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;

    if (fileList) {
      setSelectedFile(fileList[0]);
      console.log(fileList[0]);
    }
  };
  return (
    <>
      <Typography>
        Attachments:
        {post.attachments?.map((item: string) => (
          <Typography>{item}</Typography>
        ))}
      </Typography>

      <input
        disabled={disabled}
        type="file"
        name="attachFile"
        onChange={onFileAttached}
      />
      <Button onClick={() => uploadFile()} disabled={disabled || !selectedFile}>
        Upload File
      </Button>
    </>
  );
};

export default PostingMethod;
