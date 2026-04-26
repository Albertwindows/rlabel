'use client';

import { Theme } from '@radix-ui/themes';
import { TopNav } from './components/modern/TopNav';
import { Toolbar } from './components/modern/Toolbar';
import { ImageListSidebar } from './components/modern/ImageListSidebar';
import { Canvas } from './components/modern/Canvas';
import { Sidebar } from './components/modern/Sidebar';
import { AIPanel } from './components/modern/AIPanel';
import { VideoPanel } from './components/modern/VideoPanel';
import { ClassificationPanel } from './components/modern/ClassificationPanel';
import { ChatbotPanel } from './components/modern/ChatbotPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';
import { useThemeStore } from './store/themeStore';

function App() {
  useKeyboardShortcuts();
  useAutoSave();
  const { theme } = useThemeStore();

  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" appearance={theme}>
      <div className="h-screen w-screen bg-[#f0f1f3] dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden flex flex-col">
        <TopNav />

        <div className="flex-1 flex overflow-hidden">
          <Toolbar />
          <ImageListSidebar />

          <main className="flex-1 relative overflow-hidden">
            <Canvas />
          </main>

          <div className="flex flex-col w-[260px] h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex-1 overflow-auto scroll-thin">
              <Sidebar />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 overflow-auto max-h-[50%] scroll-thin">
              <AIPanel />
              <VideoPanel />
              <ClassificationPanel />
              <ChatbotPanel />
            </div>
          </div>
        </div>
      </div>
    </Theme>
  );
}

export default App;
