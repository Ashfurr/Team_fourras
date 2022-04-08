import Phaser from 'phaser'
import PlayerController from "~/scenes/PlayerController";

export default class Game extends Phaser.Scene {
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

	private player!: Phaser.Physics.Matter.Sprite
	private playerController?: PlayerController

	constructor() {
		super('game')
	}
	init(){
		this.cursors=this.input.keyboard.createCursorKeys()
	}

	preload() {
		this.load.atlas('player', 'assets/kenney_player.png', 'assets/kenney_player_atlas.json')
		this.load.image("tiles", 'assets/tilesets/platformPack_tilesheet.png')
		this.load.image("star", 'assets/images/Save.png')
		this.load.tilemapTiledJSON('tilemap','assets/tilemaps/tiled.json')

	}

	create() {
		this.scene.launch('ui')
		const map = this.make.tilemap({key: 'tilemap'})
		const tileset = map.addTilesetImage('platformPack_tilesheet', 'tiles')

		const ground = map.createLayer('ground', tileset)
		ground.setCollisionByProperty({collides: true})
		this.matter.world.convertTilemapLayer(ground)
		console.log(ground)

		const {width, height} = this.scale

		const objectsLayer = map.getObjectLayer('objects')
		objectsLayer.objects.forEach(objData=>{
			const{ x = 0 , y = 0 , name, width} = objData
			switch(name)
			{
				case 'playerspawn':
				{
					this.player = this.matter.add.sprite(x,y, 'player')
						.setFixedRotation()
					this.playerController = new PlayerController(this.player, this.cursors)
					this.cameras.main.startFollow(this.player)
					break
				}
				case 'star':
				{
					const star = this.matter.add.sprite(x,y-50,"star",undefined,{
						isStatic:true,
						isSensor:true,
					})
					star.setData("type","star")
					break
				}
			}
		})
	}

	update(t: number, dt: number) {
		if(!this.playerController){
			return
		}
		this.playerController.update(dt)
	}
}
