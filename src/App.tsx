import { AppProvider } from './store/AppProvider';
import { Layout } from './components/Layout/Layout';

function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}

export default App;
