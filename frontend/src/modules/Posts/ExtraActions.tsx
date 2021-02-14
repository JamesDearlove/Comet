import React, { useState } from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Tooltip from "@material-ui/core/Tooltip";
import red from "@material-ui/core/colors/red";

import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";

import { useSnackbar } from "notistack";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      margin: theme.spacing(2),
    },

    dangerButton: {
      margin: theme.spacing(2),
      color: theme.palette.getContrastText(red[500]),
      backgroundColor: red[500],
      "&:hover": {
        backgroundColor: red[700],
      },
    },
  })
);

interface DeleteDialogProps {
  postTitle: string;
  dialogOpen: boolean;
  actionRunning: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteDialog = ({
  postTitle,
  dialogOpen,
  actionRunning,
  onClose,
  onConfirm,
}: DeleteDialogProps) => {
  const classes = useStyles();

  return (
    <Dialog
      open={dialogOpen}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {`Delete Post "${postTitle}"?`}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          This action can not be undone. If the post has already been published,
          posts on social platforms will not be removed.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={actionRunning} color="secondary">
          Cancel
        </Button>
        <Button
          className={classes.dangerButton}
          onClick={onConfirm}
          disabled={actionRunning}
          color="primary"
          autoFocus
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ExtraActionsProps {
  postData: any;
  postRef: any;
  onDeleted: () => void;
}

const ExtraActions = ({ postRef, postData, onDeleted }: ExtraActionsProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRunning, setDeleteRunning] = useState(false);

  const handleMoreButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteDialogOpen = () => {
    setDeleteOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    setDeleteRunning(true);
    try {
      await postRef.delete();
      enqueueSnackbar("Post deleted successfully.", { variant: "success" });
      onDeleted();
    } catch (error) {
      enqueueSnackbar("Unable to delete post. Please try again", {
        variant: "error",
      });
    }
    onDeleted();
    setDeleteRunning(false);
    handleDeleteDialogClose();
  };

  const handleDeleteDialogClose = () => {
    setDeleteOpen(false);
  };

  return (
    <>
      <Tooltip title="Post Options">
        <IconButton aria-label="more-options" onClick={handleMoreButtonClick}>
          <MoreHorizIcon />
        </IconButton>
      </Tooltip>

      <Menu
        id="options-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Duplicate</MenuItem>
        <MenuItem onClick={handleDeleteDialogOpen}>Delete</MenuItem>
      </Menu>
      <DeleteDialog
        postTitle={postData.title}
        actionRunning={deleteRunning}
        dialogOpen={deleteOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default ExtraActions;
