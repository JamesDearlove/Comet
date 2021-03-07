import React, { useEffect, useState } from "react";

import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

import firebase from "firebase/app";
import { useSnackbar } from "notistack";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      maxWidth: 200,
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      flexBasis: "33.33%",
      flexShrink: 0,
    },
    secondaryHeading: {
      fontSize: theme.typography.pxToRem(15),
      color: theme.palette.text.secondary,
    },
  })
);

interface AttachmentCardProps {
  disabled: boolean;
  attachmentRef: string;
  onDelete: () => void;
}

const AttachmentCard = ({
  disabled,
  attachmentRef,
  onDelete,
}: AttachmentCardProps) => {
  const classes = useStyles();
  const storage = firebase.storage();
  const storageRef = storage.ref(attachmentRef);
  const [loading, setLoading] = useState(true);
  const [attachmentURL, setAttachmentURL] = useState<string>();
  const [attachmentMetadata, setAttachmentMetadata] = useState<any>();

  const fileNameRef = attachmentMetadata?.customMetadata.fileName;

  useEffect(() => {
    const getStorageData = async () => {
      setAttachmentMetadata(await storageRef.getMetadata());
      setAttachmentURL(await storageRef.getDownloadURL());
      setLoading(false);
    };

    getStorageData();
  }, [storageRef]);

  const Actions = () =>
    disabled ? (
      <></>
    ) : (
      <CardActions>
        <Button size="small" color="primary" onClick={onDelete}>
          Delete
        </Button>
      </CardActions>
    );

  return loading ? (
    <></>
  ) : attachmentURL ? (
    <Card className={classes.root}>
      <CardActionArea>
        <CardMedia
          component="img"
          alt={fileNameRef}
          height="140"
          image={attachmentURL}
          title={fileNameRef}
        />
      </CardActionArea>
      <CardContent>{fileNameRef}</CardContent>
      <Actions />
    </Card>
  ) : (
    <Card className={classes.root}>
      <CardContent>Attachment not found</CardContent>
      <Actions />
    </Card>
  );
};

interface PostAttachmentsProps {
  disabled: boolean;
  post: firebase.firestore.DocumentData;
  setPost: React.Dispatch<
    React.SetStateAction<firebase.firestore.DocumentData | undefined>
  >;
}

const PostAttachments = ({ disabled, post, setPost }: PostAttachmentsProps) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const [expanded, setExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();

  const attachmentCount = post?.attachments?.length || 0;
  const secondaryHeading =
    `${attachmentCount} attachment` + (attachmentCount === 1 ? "" : "s");

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

  const removeFile = (index: number) => {
    post.attachments.pop(index);

    setPost({ ...post, attachments: [...post.attachments] });
  };

  const onFileAttached = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;

    if (fileList) {
      setSelectedFile(fileList[0]);
    }
  };

  return (
    <>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography className={classes.heading}>Attachments</Typography>
          <Typography className={classes.secondaryHeading}>
            {secondaryHeading}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {post.attachments?.map((item: string, index: number) => (
              <Grid key={index} item>
                <AttachmentCard
                  disabled={disabled}
                  onDelete={() => removeFile(index)}
                  attachmentRef={item}
                />
              </Grid>
            ))}

            {!disabled && (
              <Grid item xs={12}>
                <input
                  type="file"
                  name="attachFile"
                  onChange={onFileAttached}
                />
                <Button onClick={() => uploadFile()} disabled={!selectedFile}>
                  Upload File
                </Button>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default PostAttachments;
