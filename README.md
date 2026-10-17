# snowball

so yeah this is a snowball dash. its a lil 2d game i made on html canvas where you roll down a snowy hill as snowball

yo gotta dodge trees, rocks n logs but u can collect coins and snowmen to get bigger and score points. be careful tho there are ice patches that make u slide all over the place.

## hot to play

no npm, no build tools, just plain old html/js.
just open html file in ur browser and it should work.

- use `←` `→` or `a` / `d` to move
- press `enter` to start or restart
- press `p` to pause

## what i learned / the struggle

ngl this one didnt take just an hour. canvas is cool but the math for collison detection (especially with the logs and the oval ice patches) really messed with ma brain at first.

i also had a bug where the ball would just stick to the wall if you held the arrow ke to long, took me forever to fix the velocity logic.

some other stuff i figured out:
- how to make a game loop using `requestAnimationFrame`
- handling different game states (menu, playing, paused, game over)
- making levels that get harder by increasing speed and spawn rates
- saving the high score so it doesn't reset when you refresh


ofc its not the biggest game in the world but i wrote the logic myself and i understand how it works.