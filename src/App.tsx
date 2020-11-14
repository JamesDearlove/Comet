import React from 'react';
import Sidebar from './components/Sidebar';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import SignInScreen from './components/SignInScreen';

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: blue,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Sidebar />
      <main>
        <h1>Hello World!</h1>
        <SignInScreen />
      </main>
    </ThemeProvider>
  );
}

export default App;
