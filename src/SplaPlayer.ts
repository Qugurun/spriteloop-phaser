import Phaser from 'phaser';
import { SPLA_EVENT } from './SplaEvents';
import { findAnimationIndex } from './SplaPackage';
import type {
    CachedSplaPackage,
    SplaAnimation,
    SplaFrame,
    SplaPackageData,
    SplaPlayOptions,
    SplaPlaybackEvent
} from './types';

const DEFAULT_MAX_PENDING_EVENTS = 256;

export class SplaPlayer
{
    readonly package: SplaPackageData | CachedSplaPackage;
    readonly maxPendingEvents: number;

    pendingEvents: SplaPlaybackEvent[] = [];
    droppedEventCount = 0;
    playbackRate = 1;
    playing = false;
    playbackEventsEnabled = true;
    loopOverride: boolean | null = null;
    elapsedSeconds = 0;
    currentAnimationIndex = -1;
    currentFrameIndex = 0;
    emitter: Phaser.Events.EventEmitter | null = null;

    constructor(packageData: SplaPackageData | CachedSplaPackage, maxPendingEvents = DEFAULT_MAX_PENDING_EVENTS)
    {
        this.package = packageData;
        this.maxPendingEvents = maxPendingEvents > 0 ? maxPendingEvents : DEFAULT_MAX_PENDING_EVENTS;
    }

    get currentAnimation(): SplaAnimation | null
    {
        return this.currentAnimationIndex >= 0
            ? this.package.animations[this.currentAnimationIndex]
            : null;
    }

    get currentFrame(): SplaFrame | null
    {
        const animation = this.currentAnimation;

        if (!animation || animation.frames.length === 0)
        {
            return null;
        }

        const index = Math.max(0, Math.min(this.currentFrameIndex, animation.frames.length - 1));
        return animation.frames[index];
    }

    get effectiveLoop(): boolean
    {
        const animation = this.currentAnimation;

        if (!animation)
        {
            return false;
        }

        if (this.loopOverride !== null)
        {
            return this.loopOverride;
        }

        return animation.loop;
    }

    play(animationIdOrName: string, options: SplaPlayOptions = {}): boolean
    {
        const animationIndex = findAnimationIndex(this.package, animationIdOrName);

        if (animationIndex < 0)
        {
            return false;
        }

        const emitEvents = options.emitEvents !== false;
        this.currentAnimationIndex = animationIndex;
        this.elapsedSeconds = 0;
        this.currentFrameIndex = 0;
        this.playing = true;
        this.playbackEventsEnabled = emitEvents;
        this.loopOverride = typeof options.loop === 'boolean' ? options.loop : null;

        if (emitEvents)
        {
            this.queueFrameEvents(this.currentAnimation!, 0);
        }

        return true;
    }

    stop(): void
    {
        this.playing = false;
    }

    update(deltaSeconds: number): void
    {
        const animation = this.currentAnimation;

        if (!this.playing || !animation || animation.frames.length === 0 || animation.fps <= 0)
        {
            return;
        }

        const previousRawFrame = this.rawFrameIndexForTime(animation);
        this.elapsedSeconds += deltaSeconds * this.playbackRate;
        const nextRawFrame = this.rawFrameIndexForTime(animation);

        if (this.playbackEventsEnabled)
        {
            this.queueCrossedEvents(animation, previousRawFrame, nextRawFrame);
        }

        this.currentFrameIndex = this.frameIndexForTime(animation);
    }

    setTime(seconds: number, options: SplaPlayOptions = {}): void
    {
        const animation = this.currentAnimation;

        if (!animation || animation.frames.length === 0)
        {
            return;
        }

        const emitEvents = options.emitEvents !== false;
        this.elapsedSeconds = Math.max(0, seconds);
        const nextFrameIndex = this.frameIndexForTime(animation);

        if (emitEvents && this.playbackEventsEnabled)
        {
            this.queueFrameEvents(animation, nextFrameIndex);
        }

        this.currentFrameIndex = nextFrameIndex;
    }

    setFrame(frameIndex: number, options: SplaPlayOptions = {}): void
    {
        const animation = this.currentAnimation;

        if (!animation || animation.frames.length === 0)
        {
            return;
        }

        const emitEvents = options.emitEvents !== false;
        const clampedIndex = Math.max(0, Math.min(frameIndex, animation.frames.length - 1));
        this.elapsedSeconds = clampedIndex / animation.fps;
        this.currentFrameIndex = clampedIndex;

        if (emitEvents && this.playbackEventsEnabled)
        {
            this.queueFrameEvents(animation, clampedIndex);
        }
    }

    consumeEvents(): SplaPlaybackEvent[]
    {
        const events = this.pendingEvents.slice();
        this.pendingEvents.length = 0;
        return events;
    }

    rawFrameIndexForTime(animation: SplaAnimation | null = this.currentAnimation): number
    {
        if (!animation || animation.frames.length === 0 || animation.fps <= 0)
        {
            return 0;
        }

        return Math.floor(this.elapsedSeconds * animation.fps);
    }

    frameIndexForTime(animation: SplaAnimation | null = this.currentAnimation): number
    {
        if (!animation || animation.frames.length === 0)
        {
            return 0;
        }

        const rawFrame = this.rawFrameIndexForTime(animation);

        if (this.effectiveLoop)
        {
            const frameCount = animation.frames.length;
            return ((rawFrame % frameCount) + frameCount) % frameCount;
        }

        return Math.max(0, Math.min(rawFrame, animation.frames.length - 1));
    }

    private queueCrossedEvents(animation: SplaAnimation, previousRawFrame: number, nextRawFrame: number): void
    {
        if (!animation || animation.frames.length === 0)
        {
            return;
        }

        if (this.effectiveLoop)
        {
            const frameCount = animation.frames.length;

            if (nextRawFrame >= previousRawFrame)
            {
                for (let frame = previousRawFrame + 1; frame <= nextRawFrame; frame++)
                {
                    this.queueFrameEvents(animation, ((frame % frameCount) + frameCount) % frameCount);
                }
            }
            else
            {
                for (let frame = previousRawFrame + 1; frame < previousRawFrame + frameCount; frame++)
                {
                    this.queueFrameEvents(animation, ((frame % frameCount) + frameCount) % frameCount);
                }
            }

            return;
        }

        const maxFrame = animation.frames.length - 1;
        const clampedNext = Math.min(nextRawFrame, maxFrame);

        for (let frame = previousRawFrame + 1; frame <= clampedNext; frame++)
        {
            this.queueFrameEvents(animation, frame);
        }
    }

    private queueFrameEvents(animation: SplaAnimation, frameIndex: number): void
    {
        const frame = animation.frames[frameIndex];

        if (!frame)
        {
            return;
        }

        for (const event of frame.events)
        {
            this.queueEvent({
                animationId: animation.id,
                animationName: animation.name,
                frameIndex: frame.index,
                sourceFrame: frame.sourceFrame,
                name: event.name,
                eventName: event.name,
                data: event.data
            });
        }
    }

    private queueEvent(event: SplaPlaybackEvent): void
    {
        if (this.pendingEvents.length >= this.maxPendingEvents)
        {
            this.pendingEvents.shift();
            this.droppedEventCount += 1;
        }

        this.pendingEvents.push(event);
        this.emitPlaybackEvent(event);
    }

    private emitPlaybackEvent(event: SplaPlaybackEvent): void
    {
        if (!this.emitter)
        {
            return;
        }

        const eventName = event.eventName || event.name;

        this.emitter.emit(eventName, event);

        if (eventName !== SPLA_EVENT)
        {
            this.emitter.emit(SPLA_EVENT, event);
        }
    }
}
