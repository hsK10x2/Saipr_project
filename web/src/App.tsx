import { Backdrop, TabBar, Toaster } from './components';
import { useRoute } from './router';
import Home from './screens/Home';
import League from './screens/League';
import Race from './screens/Race';
import Reader from './screens/Reader';
import Room from './screens/Room';
import Search from './screens/Search';
import SettingsScreen from './screens/Settings';

export default function App() {
  const route = useRoute();
  const immersive = route.name === 'reader' || route.name === 'race';

  return (
    <div className="app">
      <Backdrop />
      <main className={`screen${immersive ? ' immersive' : ''}`} key={route.name}>
        {route.name === 'home' && <Home />}
        {route.name === 'search' && <Search />}
        {route.name === 'reader' && <Reader bookKey={route.bookKey} />}
        {route.name === 'room' && <Room />}
        {route.name === 'race' && <Race />}
        {route.name === 'league' && <League />}
        {route.name === 'settings' && <SettingsScreen />}
      </main>
      {!immersive && <TabBar active={route.name} />}
      <Toaster />
    </div>
  );
}
