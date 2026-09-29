import { useCallback, useReducer, useRef } from 'react';
import { CONFIG } from './config';
import { gameReducer, handAngles, initialState, timeOfDay, wakeMinutes } from './game/gameState';
import { useGameLoop } from './game/useGameLoop';
import { useFeeding } from './game/useFeeding';
import { formatClock, formatDuration } from './game/format';
import { skyWeights } from './game/sky';
import { clockView, modalView } from './game/sequence';
import { Stage } from './components/Stage';
import { Sky } from './components/Sky';
import { Clock } from './components/Clock';
import { Hud } from './components/Hud';
import { Avatar } from './components/Avatar';
import { Tray } from './components/Tray';
import { DimOverlay } from './components/DimOverlay';
import { CursorFollower } from './components/CursorFollower';
import { EndModal } from './components/EndModal';
import { DebugPanel } from './components/DebugPanel';
import { DEBUG_ENABLED } from './game/debug';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  const stageRef = useRef<HTMLDivElement>(null);
  const playing = state.status === 'playing';

  const onFeed = useCallback((minutes: number) => dispatch({ type: 'feed', minutes }), []);
  const feeding = useFeeding({ playing, stageRef, onFeed });

  // The one rAF loop: game time, then the cursor follower.
  useGameLoop((dtReal) => {
    dispatch({ type: 'tick', dtReal });
    feeding.onFrame(dtReal);
  });

  const tod = timeOfDay(state.gameTimeMs);
  const isDay = tod.h >= CONFIG.SUN_ICON_START_HOUR && tod.h < CONFIG.SUN_ICON_END_HOUR;
  const sky = skyWeights(tod.hours);
  const isNormalSpeed = state.speed === CONFIG.SPEED_NORMAL;
  const clock = clockView(state);
  const modal = modalView(state);

  const restart = () => {
    feeding.reset();
    dispatch({ type: 'restart' });
  };

  return (
    <>
      <Stage stageRef={stageRef} holding={feeding.held !== null} {...feeding.stageHandlers}>
        <Sky weights={sky} />
        <Clock angles={handAngles(clock.timeMs)} handsOpacity={clock.opacity} />
        <Avatar mood={state.mood} glow={feeding.glow} feedCount={feeding.feedCount} />
        {/* HUD before the tray so keyboard focus follows the visual order. */}
        <Hud
          timeText={formatClock(tod.h, tod.m)}
          isDay={isDay}
          wakeText={`Wake count: ${formatDuration(wakeMinutes(state))}`}
          speedLabel={isNormalSpeed ? 'Speed Up' : 'Reset Time'}
          onSpeedClick={() =>
            dispatch({ type: 'setSpeed', speed: isNormalSpeed ? CONFIG.SPEED_FAST : CONFIG.SPEED_NORMAL })
          }
          disabled={!playing}
        />
        <Tray heldId={feeding.held} disabled={!playing} onKeyboardFeed={feeding.feedFromKeyboard} />
        <DimOverlay opacity={state.dim} />
        <CursorFollower
          follower={feeding.follower}
          dropping={feeding.dropping}
          bubbles={feeding.bubbles}
          onDropDone={feeding.clearDropping}
          onBubbleDone={feeding.removeBubble}
        />
        {modal && (
          <EndModal
            view={modal}
            wakeText={`Wake count: ${formatDuration(state.endedWakeMs / 60_000)}`}
            onRestart={restart}
          />
        )}
        {DEBUG_ENABLED && <DebugPanel state={state} sky={sky} dispatch={dispatch} modalShowing={modal !== null} />}
      </Stage>
    </>
  );
}
