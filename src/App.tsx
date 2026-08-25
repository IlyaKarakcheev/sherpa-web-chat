import React, { useState, useMemo } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  tokens,
  shorthands,
  Button,
} from '@fluentui/react-components';
import {
  WeatherMoon20Regular,
  WeatherSunny20Regular,
} from '@fluentui/react-icons';
import { ChatPanel } from './components/ChatPanel';
import { MockChatService } from '../mocks/mockService';
import { createChatService } from './services/chatService';

const useStyles = makeStyles({
  appWrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  sidebar: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  devToolbar: {
    flexGrow: 1,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderLeft('1px', 'solid', tokens.colorNeutralStroke2),
  },
  devTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  scenarioCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  scenarioButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
});

export const App: React.FC = () => {
  const styles = useStyles();
  const [isDark, setIsDark] = useState(false);
  const [isCollisionMode, setIsCollisionMode] = useState(false);
  const [isValidationErrMode, setIsValidationErrMode] = useState(false);
  const [isNetworkErrMode, setIsNetworkErrMode] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const isMockMode =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.MODE === 'mock' || import.meta.env.VITE_MOCK_MODE === 'true'
      : false;

  const mockService = useMemo(() => {
    return new MockChatService({
      simulateCollision: isCollisionMode,
      simulateValidationError: isValidationErrMode,
      simulateNetworkError: isNetworkErrMode,
      streamingStepDelayMs: 300,
    });
  }, [isCollisionMode, isValidationErrMode, isNetworkErrMode, reloadKey]);

  const chatService = useMemo(() => {
    if (isMockMode) {
      return mockService;
    }
    return createChatService(false);
  }, [isMockMode, mockService]);

  const handleScenarioChange = (scenario: 'happy' | 'collision' | 'validation' | 'network') => {
    setIsCollisionMode(scenario === 'collision');
    setIsValidationErrMode(scenario === 'validation');
    setIsNetworkErrMode(scenario === 'network');
    setReloadKey((prev) => prev + 1);
  };

  return (
    <FluentProvider theme={isDark ? webDarkTheme : webLightTheme}>
      <div className={styles.appWrapper}>
        <div className={styles.sidebar}>
          <ChatPanel
            key={`chat-panel-${reloadKey}`}
            chatService={chatService}
            enableSSEStream={!isMockMode || (!isCollisionMode && !isValidationErrMode && !isNetworkErrMode)}
          />
        </div>

        {isMockMode && (
        <div className={styles.devToolbar}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={styles.devTitle}>🛠 Панель сценариев (Zero-Manual Mocks)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                appearance="subtle"
                icon={isDark ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
                onClick={() => setIsDark((prev) => !prev)}
                title="Переключить светлую/темную тему"
              >
                {isDark ? 'Светлая тема' : 'Темная тема'}
              </Button>
            </div>
          </div>

          <div className={styles.scenarioCard}>
            <strong>Быстрое переключение сценариев эмуляции:</strong>
            <div className={styles.scenarioButtons}>
              <Button
                appearance={!isCollisionMode && !isValidationErrMode && !isNetworkErrMode ? 'primary' : 'outline'}
                onClick={() => handleScenarioChange('happy')}
              >
                1. Positive (Zero-Click & e1cib)
              </Button>
              <Button
                appearance={isCollisionMode ? 'primary' : 'outline'}
                onClick={() => handleScenarioChange('collision')}
              >
                2. Negative 409 (ALREADY_PROCESSED)
              </Button>
              <Button
                appearance={isValidationErrMode ? 'primary' : 'outline'}
                onClick={() => handleScenarioChange('validation')}
              >
                3. Negative 400 (Validation Error)
              </Button>
              <Button
                appearance={isNetworkErrMode ? 'primary' : 'outline'}
                onClick={() => handleScenarioChange('network')}
              >
                4. Network Failure
              </Button>
            </div>
          </div>

          <div className={styles.scenarioCard}>
            <strong>Горячие клавиши & UX:</strong>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong>Клавиши 1..4:</strong> быстрый выбор вариантов (Keyboard-First).</li>
              <li><strong>Клик по ссылке 1С:</strong> копирование `e1cib/...` в буфер обмена + всплывающий Toast.</li>
              <li><strong>Клавиша Esc:</strong> скрытие плашки ответа (Reply Banner).</li>
              <li><strong>Drag-and-Drop:</strong> перетаскивание файлов `.msg` / `.eml` в окно чата.</li>
            </ul>
          </div>
        </div>
        )}
      </div>
    </FluentProvider>
  );
};
