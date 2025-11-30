import React, { useState } from 'react';
import { AppView, Match } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProductCatalog from './components/ProductCatalog';
import Home from './components/Home';
import ArticleView from './components/ArticleView';
import ShortformViewer from './components/ShortformViewer';
import SearchResults from './components/SearchResults';
import { useEventLogger } from './services/events';
import ContentWorkbench from './components/ContentWorkbench';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [searchQuery, setSearchQuery] = useState<string>('여름 셔츠');
  const { log } = useEventLogger();

  React.useEffect(() => {
    log({ event: 'page_view', contentId: `view_${currentView}` });
  }, [currentView, log]);

  const renderView = () => {
    switch (currentView) {
      case AppView.HOME:
        return (
          <Home
            onCategoryClick={(cat) => {
              setSearchQuery(cat);
              setCurrentView(AppView.SEARCH);
            }}
            onSeeArticle={() => setCurrentView(AppView.ARTICLE)}
            onSeeShortform={() => setCurrentView(AppView.SHORTFORM)}
          />
        );
      case AppView.ARTICLE:
        return <ArticleView />;
      case AppView.SHORTFORM:
        return <ShortformViewer />;
      case AppView.SEARCH:
        return (
          <SearchResults
            initialQuery={searchQuery}
            onQueryChange={setSearchQuery}
            onProductClick={(url) => {
              if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
              } else {
                setCurrentView(AppView.PRODUCT_DETAIL);
              }
            }}
          />
        );
      case AppView.ADMIN:
        return <Dashboard />;
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.PRODUCTS:
        return <ProductCatalog />;
      case AppView.ANALYZER:
        return <ContentWorkbench />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
