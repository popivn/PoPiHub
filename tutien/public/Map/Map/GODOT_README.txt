Meowa Godot map export

Open this folder as a Godot 4.6 project. The main scene is scenes/map.tscn.
Tile PNGs used by the scene are under assets/tiles/. Object PNGs are under assets/objects/.
Every visible tile and object is a Sprite2D node, so the map can be edited directly in the Godot editor.
The generated Camera2D centers the map and zooms out when needed so the full map is visible at launch.
The original Meowa map data is preserved in meowa-map.json.
