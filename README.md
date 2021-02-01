# Comet

Comet is a social media management platform built for the rest of us.

It was initially built as part of an effort to make posting across the [UQ Computing Society](https://uqcs.org)'s social media channels much easier.

## Dev Environement

Comet uses the `yarn` package manager. It is recommeneded that you have the Firebase CLI installed.

To get setup, run `yarn` in the `frontend` and `functions` folders.

## Deployment

Comet is built for Firebase with it's frontend built with React and backend written in Typescript for GCP Cloud Functions.

### Frontend

To deploy the frontend:

1. Change your working directory to the `frontend` folder.
2. Build the React app using `yarn build`
3. Deploy to Firebase by running `firebase deploy --only hosting`

### Cloud Functions

To deploy the backend:

1. Change your working directory to the `backend` folder.
2. Run `yarn lint` to ensure there is no compiler warnings or errors.
3. Deploy to Firebase by running `firebase deploy --only functions`
