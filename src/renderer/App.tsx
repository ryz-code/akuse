import '..//styles/components.css';
import '../styles/animations.css';
import '../styles/style.css';
import 'react-loading-skeleton/dist/skeleton.css';

import { createContext, useEffect, useState } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  getMostPopularAnime,
  getNextReleases,
  getTrendingAnime,
  getViewerId,
  getViewerInfo,
  getViewerList,
} from '../modules/anilist/anilistApi';
import { animeDataToListAnimeData } from '../modules/utils';
import { ListAnimeData, UserInfo } from '../types/anilistAPITypes';
import MainNavbar from './MainNavbar';
import Tab1 from './tabs/Tab1';
import Tab2 from './tabs/Tab2';
import Tab3 from './tabs/Tab3';
import Tab4 from './tabs/Tab4';

import { ipcRenderer } from 'electron';
import AutoUpdateModal from './components/modals/AutoUpdateModal';
import WindowControls from './WindowControls';
import { useStorage } from './hooks/storage';
import { OS } from '../modules/os';

ipcRenderer.on('console-log', (event, toPrint) => {
  console.log(toPrint);
});

export const ViewerIdContext = createContext<number | null>(null);

export default function App() {
  const { logged } = useStorage();
  const [viewerId, setViewerId] = useState<number | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  ipcRenderer.on('auto-update', async () => {
    setShowUpdateModal(true);
  });

  // tab1
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [animeLoaded, setAnimeLoaded] = useState<boolean>(false);
  const [currentListAnime, setCurrentListAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [trendingAnime, setTrendingAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [mostPopularAnime, setMostPopularAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  const [nextReleasesAnime, setNextReleasesAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);

  // tab2
  const [tab2Click, setTab2Click] = useState<boolean>(false);
  const [planningListAnime, setPlanningListAnimeListAnime] = useState<
    ListAnimeData[] | undefined
  >(undefined);
  // const [completedListAnime, setCompletedListAnimeListAnime] = useState<
  //   ListAnimeData[] | undefined
  // >(undefined);
  // const [droppedListAnime, setDroppedListAnimeListAnime] = useState<
  //   ListAnimeData[] | undefined
  // >(undefined);
  // const [pausedListAnime, setPausedListAnimeListAnime] = useState<
  //   ListAnimeData[] | undefined
  // >(undefined);
  // const [RepeatingListAnime, setRepeatingListAnimeListAnime] = useState<
  //   ListAnimeData[] | undefined
  // >(undefined);

  const style = getComputedStyle(document.body);

  const fetchTab1AnimeData = async (loggedIn: boolean) => {
    try {
      var id = null;
      if (loggedIn) {
        id = await getViewerId();
        setViewerId(id);

        const info = await getViewerInfo(id);
        setUserInfo(info);
        const current = await getViewerList(id, 'CURRENT');
        const rewatching = await getViewerList(id, 'REPEATING');
        setCurrentListAnime(current.concat(rewatching));
      }

      if (!animeLoaded) {
        setTrendingAnime(animeDataToListAnimeData(await getTrendingAnime(id)));
        setMostPopularAnime(
          animeDataToListAnimeData(await getMostPopularAnime(id)),
        );
        setNextReleasesAnime(
          animeDataToListAnimeData(await getNextReleases(id)),
        );
        setAnimeLoaded(true);
      }
    } catch (error) {
      console.log('Tab1 error: ' + error);
    }
  };

  const fetchTab2AnimeData = async () => {
    try {
      if (viewerId) {
        setPlanningListAnimeListAnime(
          await getViewerList(viewerId, 'PLANNING'),
        );
        // setCompletedListAnimeListAnime(
        //   await getViewerList(viewerId, 'COMPLETED'),
        // );
        // setDroppedListAnimeListAnime(await getViewerList(viewerId, 'DROPPED'));
        // setPausedListAnimeListAnime(await getViewerList(viewerId, 'PAUSED'));
        // setRepeatingListAnimeListAnime(
        //   await getViewerList(viewerId, 'REPEATING'),
        // );
      }
    } catch (error) {
      console.log('Tab2 error: ' + error);
    }
  };

  useEffect(() => {
    void fetchTab1AnimeData(logged);
  }, [logged]);

  useEffect(() => {
    if (tab2Click) {
      void fetchTab2AnimeData();
    }
  }, [tab2Click, viewerId]);

  return (
      <ViewerIdContext.Provider value={viewerId}>
        <SkeletonTheme
          baseColor={style.getPropertyValue('--color-3')}
          highlightColor={style.getPropertyValue('--color-4')}
        >
          <AutoUpdateModal
            show={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false);
            }}
          />
          <MemoryRouter>
            {!OS.isMac && <WindowControls />}
            <MainNavbar avatar={userInfo?.avatar?.medium} />
            <Routes>
              <Route
                path="/"
                element={
                  <Tab1
                    userInfo={userInfo}
                    currentListAnime={currentListAnime}
                    trendingAnime={trendingAnime}
                    mostPopularAnime={mostPopularAnime}
                    nextReleasesAnime={nextReleasesAnime}
                  />
                }
              />
              {logged && (
                <Route
                  path="/tab2"
                  element={
                    <Tab2
                      currentListAnime={currentListAnime}
                      planningListAnime={planningListAnime}
                      // completedListAnime={completedListAnime}
                      // droppedListAnime={droppedListAnime}
                      // pausedListAnime={pausedListAnime}
                      // repeatingListAnime={RepeatingListAnime}
                      clicked={() => {
                        !tab2Click && setTab2Click(true);
                      }}
                    />
                  }
                />
              )}
              <Route path="/tab3" element={<Tab3 />} />
              <Route path="/tab4" element={<Tab4 />} />
            </Routes>
          </MemoryRouter>
        </SkeletonTheme>
      </ViewerIdContext.Provider>
  );
}
