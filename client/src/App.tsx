/**
 * Root component. PixShare is a single page for now (HomePage holds the navbar, feed,
 * collections and friends views), so there is no router yet. Add one here when a
 * second page is needed.
 */
import { HomePage } from "./pages/HomePage.tsx";


function App() {
  return <HomePage />;
}

export default App;
