class scene extends Phaser.Scene {
  function

  preload() {
    this.load.image('background', 'assets/images/background.png');
    this.load.image('door', 'assets/images/Door.png');
    this.load.image('key', 'assets/images/Key.png');
    this.load.image('spike', 'assets/images/spike.png');
    this.load.image('move', 'assets/images/mouvable.png');
    this.load.image('save', 'assets/images/Save.png');
    // At last image must be loaded with its JSON
    this.load.atlas('player', 'assets/images/kenney_player.png', 'assets/images/kenney_player_atlas.json');
    this.load.image('tiles', 'assets/tilesets/platformPack_tilesheet.png');
    // Load the export Tiled JSON
    this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
  }


  create() {
    this.currentSaveX = 1
    this.currentSaveY = 1

    const backgroundImage = this.add.image(0, 0, 'background').setOrigin(0, 0);
    backgroundImage.setScale(2, 0.8);
    const map = this.make.tilemap({key: 'map'});
    const tileset = map.addTilesetImage('kenny_simple_platformer', 'tiles');
    this.platforms = map.createStaticLayer('Platforms', tileset, 0, 200);
    this.platforms.setCollisionByProperty({collides:true})

    this.doors=this.physics.add.group({
      allowGravity: false,
      immovable: true
    })
    map.getObjectLayer('Door').objects.forEach((doors)=>{
      const DoorSprite = this.doors.create(doors.x, doors.y +9+ doors.height, 'door').setOrigin(0);
    });
    this.key=this.physics.add.group({
      allowGravity: false,
      immovable: true
    })
    map.getObjectLayer('key').objects.forEach((key)=>{
      const keySprite = this.key.create(key.x, key.y +200- key.height, 'key').setOrigin(0);
    });

    this.moves = this.physics.add.group({
      allowGravity: true,
      immovable: false
    });
    map.getObjectLayer('Mouvable').objects.forEach((move) => {
      this.moveSprite = this.moves.create(move.x, move.y + 100 - move.height, 'move').setOrigin(0);
    });

    this.physics.add.collider(this.moves, this.moveSprite)
    this.physics.add.collider(this.moves, this.platforms)

    this.player = new Player(this)

    this.spikes = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    map.getObjectLayer('Spikes').objects.forEach((spike) => {
      const spikeSprite = this.spikes.create(spike.x, spike.y + 200 - spike.height, 'spike').setOrigin(0);
      spikeSprite.body.setSize(spike.width, spike.height - 20).setOffset(0, 20);
    });
    this.physics.add.collider(this.player.player, this.spikes, this.playerHit, null, this);

    this.saves = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });


    map.getObjectLayer('Save').objects.forEach((save) => {
      const saveSprite = this.saves.create(save.x, save.y + 200 - save.height, 'save').setOrigin(0);
    });
    this.physics.add.overlap(this.player.player, this.saves, this.sauvegarde, null, this)

    this.cursors = this.input.keyboard.createCursorKeys();
    this.cameras.main.startFollow(this.player.player);


  }
  sauvegarde(player, saves) {
    console.log("current", this.currentSaveX, this.currentSaveY)
    this.currentSaveX = player.x
    this.currentSaveY = player.y
    saves.body.enable = false;
  }

  playerHit(player, spike) {
    player.setVelocity(0, 0);
    player.x = this.currentSaveX
    player.y = this.currentSaveY;
    player.play('idle', true);
    player.setAlpha(0);
    let tw = this.tweens.add({
      targets: player,
      alpha: 1,
      duration: 100,
      ease: 'Linear',
      repeat: 5,
    });
  }


  update() {
    this.moves.setVelocityX(0)
    if (this.moveSprite.body.velocityX>10){
      this.moveSprite.setVelocityX(0)
    }

    if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.player.body.onFloor()) {
      this.player.jump()
      console.log("oui")
    }
    if (this.cursors.left.isDown) {
      this.player.moveLeft()
    } else if (this.cursors.right.isDown) {
      this.player.moveRight()
    } else {
      this.player.stop();
    }
  }
}