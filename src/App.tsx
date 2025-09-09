import { ImageToCAD } from "./components/ImageToCAD.js";
import { ThemeProvider } from "./hooks/useTheme.js";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <ImageToCAD />
    </ThemeProvider>
  );
}

export default App;
