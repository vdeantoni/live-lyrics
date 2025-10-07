/**
 * Centralized test data for all tests
 *
 * This file provides shared test data constants to eliminate duplication
 * between unit tests and E2E tests.
 */

/** Enhanced LRC format with word-level timing */
export const BOHEMIAN_RHAPSODY_ENHANCED_LRC = `[00:00.00]<00:00.00>Is <00:00.30>this <00:00.50>the <00:00.80>real <00:01.20>life?
[00:02.00]<00:02.00>Is <00:02.30>this <00:02.50>just <00:02.90>fantasy?
[00:04.00]<00:04.00>Caught <00:04.40>in <00:04.60>a <00:04.80>landslide
[00:06.00]<00:06.00>No <00:06.40>escape <00:06.90>from <00:07.20>reality
[00:08.00]<00:08.00>Open <00:08.40>your <00:08.70>eyes
[00:10.00]<00:10.00>Look <00:10.30>up <00:10.50>to <00:10.70>the <00:10.90>skies <00:11.30>and <00:11.50>see
[00:13.00]<00:13.00>I'm <00:13.20>just <00:13.50>a <00:13.70>poor <00:14.10>boy, <00:14.50>I <00:14.70>need <00:15.00>no <00:15.30>sympathy
[00:17.00]<00:17.00>Because <00:17.50>I'm <00:17.80>easy <00:18.20>come, <00:18.60>easy <00:19.00>go
[00:20.00]<00:20.00>Little <00:20.40>high, <00:20.80>little <00:21.20>low
[00:22.00]<00:22.00>Any <00:22.30>way <00:22.60>the <00:22.80>wind <00:23.20>blows, <00:23.70>doesn't <00:24.20>really <00:24.70>matter <00:25.20>to <00:25.50>me
[00:27.00]<00:27.00>To <00:27.50>me
[00:30.00]<00:30.00>Mama, <00:30.50>just <00:30.80>killed <00:31.20>a <00:31.40>man
[00:33.00]<00:33.00>Put <00:33.30>a <00:33.50>gun <00:33.80>against <00:34.30>his <00:34.60>head
[00:35.00]<00:35.00>Pulled <00:35.40>my <00:35.70>trigger, <00:36.20>now <00:36.50>he's <00:36.80>dead
[00:38.00]<00:38.00>Mama, <00:38.50>life <00:38.90>had <00:39.20>just <00:39.60>begun
[00:41.00]<00:41.00>But <00:41.30>now <00:41.60>I've <00:41.90>gone <00:42.30>and <00:42.60>thrown <00:43.00>it <00:43.30>all <00:43.60>away
[00:46.00]<00:46.00>Mama, <00:46.50>ooh
[00:49.00]<00:49.00>Didn't <00:49.40>mean <00:49.70>to <00:49.90>make <00:50.20>you <00:50.50>cry
[00:52.00]<00:52.00>If <00:52.30>I'm <00:52.50>not <00:52.80>back <00:53.10>again <00:53.50>this <00:53.80>time <00:54.10>tomorrow
[00:55.00]<00:55.00>Carry <00:55.40>on, <00:55.80>carry <00:56.20>on
[00:57.00]<00:57.00>As <00:57.20>if <00:57.40>nothing <00:57.90>really <00:58.40>matters`;

/** Standard LRC format with line-level timing only */
export const BOHEMIAN_RHAPSODY_NORMAL_LRC = `[00:00.00]Is this the real life?
[00:02.00]Is this just fantasy?
[00:04.00]Caught in a landslide
[00:06.00]No escape from reality
[00:08.00]Open your eyes
[00:10.00]Look up to the skies and see
[00:13.00]I'm just a poor boy, I need no sympathy
[00:17.00]Because I'm easy come, easy go
[00:20.00]Little high, little low
[00:22.00]Any way the wind blows, doesn't really matter to me
[00:27.00]To me
[00:30.00]Mama, just killed a man
[00:33.00]Put a gun against his head
[00:35.00]Pulled my trigger, now he's dead
[00:38.00]Mama, life had just begun
[00:41.00]But now I've gone and thrown it all away
[00:46.00]Mama, ooh
[00:49.00]Didn't mean to make you cry
[00:52.00]If I'm not back again this time tomorrow
[00:55.00]Carry on, carry on
[00:57.00]As if nothing really matters`;

/** Plain text format with no timing information */
export const BOHEMIAN_RHAPSODY_PLAIN_TEXT = `Is this the real life?
Is this just fantasy?
Caught in a landslide
No escape from reality
Open your eyes
Look up to the skies and see
I'm just a poor boy, I need no sympathy
Because I'm easy come, easy go
Little high, little low
Any way the wind blows, doesn't really matter to me
To me
Mama, just killed a man
Put a gun against his head
Pulled my trigger, now he's dead
Mama, life had just begun
But now I've gone and thrown it all away
Mama, ooh
Didn't mean to make you cry
If I'm not back again this time tomorrow
Carry on, carry on
As if nothing really matters`;

/** Default export for backward compatibility */
export const BOHEMIAN_RHAPSODY_LRC = BOHEMIAN_RHAPSODY_ENHANCED_LRC;
