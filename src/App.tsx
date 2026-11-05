import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { Window } from './components/Window';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import { usePersistentState } from './hooks/usePersistentState';
import {
  addToHistory,
  parseApiKeys,
  parseProvider,
  parseStringArray,
  DEFAULT_PROVIDER,
  STORAGE_KEYS,
} from './utils/persistence';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKeys, setApiKeys] = usePersistentState(
    STORAGE_KEYS.apiKeys,
    { anthropic: '', google: '' },
    parseApiKeys,
  );
  const [history, setHistory] = usePersistentState<string[]>(
    STORAGE_KEYS.history,
    [],
    parseStringArray,
  );
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = usePersistentState<Provider>(
    STORAGE_KEYS.provider,
    DEFAULT_PROVIDER,
    parseProvider,
  );
  const apiKey = apiKeys[provider];
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, streamingComponent, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    setHistory((prev) => addToHistory(prev, prompt));
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <div className="menubar">
        <div className="menubar-brand">
          <span className="brand-mark" aria-hidden="true">RC</span>
          <span>React 컴포넌트 생성기</span>
        </div>
        <div className="menubar-status" aria-label="현재 작업 상태">
          <span>Provider: {activeProvider}</span>
          <span>컴포넌트: {components.length}개</span>
        </div>
      </div>

      <div className="desktop">
        <header className="hero">
          <h1>프롬프트로 만드는 UI 워크벤치</h1>
          <p>요청을 입력하면 React 컴포넌트를 만들어 바로 미리보고, 코드로 확인합니다.</p>
        </header>

        <main className="workspace">
          <Window title="무엇을 만들까요?" className="composer-panel">
            <PromptInput onGenerate={handleGenerate} isLoading={isLoading} history={history} />
          </Window>

          <Window title="실행 설정" className="settings-panel">
            <div className="provider-select">
              <label htmlFor="provider">Provider</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
              >
                {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="api-key-input">
              <label htmlFor="api-key">API Key</label>
              <div className="api-key-field">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKeys((prev) => ({ ...prev, [provider]: e.target.value }))}
                  placeholder={
                    hasEnvKey
                      ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                      : PROVIDER_CONFIG[provider].placeholder
                  }
                />
                <button
                  className="btn-toggle-key"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  {showKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
                {hasEnvKey
                  ? '.env 키가 연결되어 있습니다.'
                  : '직접 입력하거나 서버 환경변수를 설정하세요.'}
              </p>
            </div>
          </Window>
        </main>

        {error && (
          <div className="error-banner" role="alert">
            <p>{error}</p>
          </div>
        )}

        <section className="results-section" aria-label="생성 결과">
          {components.length > 0 && (
            <div className="results-header">
              <h2>생성된 컴포넌트</h2>
              <button className="btn-clear" onClick={clearAll}>
                전체 삭제
              </button>
            </div>
          )}

          {components.length === 0 && !isLoading && (
            <Window title="새 문서" className="empty-state">
              <div className="empty-body">
                <div className="empty-preview" aria-hidden="true">
                  <div className="empty-window">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="empty-canvas">
                    <div className="empty-card empty-card--primary" />
                    <div className="empty-card" />
                    <div className="empty-card empty-card--wide" />
                  </div>
                </div>
                <div className="empty-copy">
                  <h3>새 컴포넌트를 생성해보세요.</h3>
                  <p>위 입력창에 만들고 싶은 UI를 적거나, 예시 프롬프트를 눌러 시작하세요.</p>
                </div>
              </div>
            </Window>
          )}

          {isLoading && !streamingComponent && (
            <Window title="작업 중" className="loading-card">
              <div className="loading-row" role="status">
                <div className="loading-bar" aria-hidden="true" />
                <p>컴포넌트를 생성하고 있습니다...</p>
              </div>
            </Window>
          )}

          <div className="results-grid">
            {streamingComponent && (
              <ComponentCard
                key={streamingComponent.id}
                component={streamingComponent}
                onRemove={removeComponent}
                onRegenerate={handleGenerate}
                isLoading={isLoading}
                isStreaming
              />
            )}
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onRemove={removeComponent}
                onRegenerate={handleGenerate}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
