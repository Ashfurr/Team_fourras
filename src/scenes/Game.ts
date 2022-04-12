import Phaser from 'phaser'
import PlayerController from "~/scenes/PlayerController";
import ObstaclesController from "~/scenes/ObstaclesController";
import SnowmanController from "~/scenes/SnowmanController";
import {sharedInstance as events} from "~/scenes/EventCenter";

export default class Game extends Phaser.Scene {
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

	private player!: Phaser.Physics.Matter.Sprite
	private playerController?: PlayerController
	private obstacles!: ObstaclesController
	private snowmen: SnowmanController[]= []

	constructor() {
		super('game')
	}
	init(){
		this.cursors=this.input.keyboard.createCursorKeys()
		this.obstacles = new ObstaclesController()
		this.snowmen=[]
		this.events.once(Phaser.Scenes.Events.DESTROY,() => {
			this.destroy()
		})
	}

	preload() {
		this.load.atlas('player', 'assets/kenney_player.png', 'assets/kenney_player_atlas.json')
		this.load.image("tiles", 'assets/tilesets/platformPack_tilesheet.png')
		this.load.image("star", 'assets/images/Save.png')
		this.load.image("health", 'assets/images/Heal.png')
		this.load.tilemapTiledJSON('tilemap','assets/tilemaps/tiled.json')
	}

	create() {
		this.cameras.main.setRoundPixels(true);
		this.scene.launch('ui')
		const map = this.make.tilemap({key: 'tilemap'})
		const tileset = map.addTilesetImage('platformPack_tilesheet', 'tiles')

		const ground = map.createLayer('ground', tileset)
		ground.setCollisionByProperty({collides: true})
		this.matter.world.convertTilemapLayer(ground)
		map.createLayer('obstacles',tileset)

		const {width, height} = this.scale

		const objectsLayer = map.getObjectLayer('objects')
		objectsLayer.objects.forEach(objData=>{
			const{ x = 0 , y = 0 , name, width=0,height=0 } = objData
			switch(name)
			{
				case 'playerspawn':
				{
					this.player = this.matter.add.sprite(x,y, 'player')
						.setFixedRotation()
					this.playerController = new PlayerController(this,this.player, this.cursors, this.obstacles)
					this.cameras.main.startFollow(this.player)
					break
				}
				case "snowman":
				{
					const snowmen =this.matter.add.sprite(x,y,"player",undefined,{
					})
						.setFixedRotation()


					this.snowmen.push(new SnowmanController(this,snowmen))
					this.obstacles.add('snowmen',snowmen.body as MatterJS.BodyType)
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
				case 'health':
				{
					const health = this.matter.add.sprite(x,y,'health',undefined,{
						isStatic: true,
						isSensor:true
					})
					health.setData('type', 'health')
					health.setData('healthPoints',10)
					break;
				}
				case 'spikes':
				{
					const spike = this.matter.add.rectangle(x+(width*0.5),y+(height*0.5), width, height,{
						isStatic:true,
					})
					this.obstacles.add('spikes', spike)

					break
				}
			}
		})
	}
destroy()
{
	this.snowmen.forEach(snowman => snowman.destroy())
}
	update(t: number, dt: number)
	{
		this.playerController?.update(dt)

		this.snowmen.forEach(snowman => snowman.update(dt))
	}
}
