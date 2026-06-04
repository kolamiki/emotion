import { useState } from 'react';
import { AppProvider } from './store/AppProvider';
import { useAppStore } from './store/appStore';
import { Layout } from './components/Layout/Layout';
import { WelcomeScreen } from './components/WelcomeScreen/WelcomeScreen';

function AppContent() {
  const [isOnboarded, setIsOnboarded] = useState(
    localStorage.getItem('emotion-onboarded') === 'true'
  );
  const { dispatch } = useAppStore();

  if (!isOnboarded) {
    return (
      <WelcomeScreen
        onComplete={(data) => {
          dispatch({ type: 'UPDATE_CURRENT_USER', user: data });
          localStorage.setItem('emotion-onboarded', 'true');
          setIsOnboarded(true);
        }}
      />
    );
  }

  return <Layout />;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
