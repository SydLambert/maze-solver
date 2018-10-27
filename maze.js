class Grid{
	constructor(width=3, height=3){
		this.width=width;
		this.height=height;

		this.cells=[];
		for(let x=0;x<this.width;x++){
			this.cells.push([]);
			for(let y=0;y<this.height;y++){
				this.cells[x].push(new Cell(this,x,y));
			}
		}
	}

	render(ctx,{
		padding=1,
		color="#FFFFFF",
		backgroundColor="#000000"
	}={}){
		ctx.fillStyle=backgroundColor;
		ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

		let cellWidth=(ctx.canvas.width-padding)/this.width;
		let cellHeight=(ctx.canvas.height-padding)/this.height;

		this.cells.flat().forEach(cell=>{
			ctx.fillStyle=cell.color||color;
			ctx.fillRect(
				Math.ceil(cell.x*cellWidth+padding),
				Math.ceil(cell.y*cellHeight+padding),
				Math.ceil(cellWidth-padding),
				Math.ceil(cellHeight-padding)
			);

			cell.links.forEach(link=>{
				ctx.strokeStyle="#00FF00";
				ctx.beginPath();
				ctx.moveTo(
					Math.ceil((cell.x*cellWidth+padding)+cellWidth/2),
					Math.ceil((cell.y*cellHeight+padding)+cellHeight/2)
				);
				ctx.lineTo(
					Math.ceil((link.x*cellWidth+padding)+cellWidth/2),
					Math.ceil((link.y*cellHeight+padding)+cellHeight/2)
				);
				ctx.stroke();
			});
		});
	}

	generateMaze(){
		let stack=[this.cells[0][0]];
		while(stack.length){
			console.log(stack);
			let top=stack[stack.length-1];
			top.visited=true;
			let adjacent=top.getAdjacent().filter(e=>!e.visited);
			if(adjacent.length){
				let link=adjacent[Math.floor(Math.random()*adjacent.length)];
				top.links.push(link);
				stack.push(link);
			}
			else{
				stack.pop();
			}
		}
	}
}

class Cell{
	constructor(grid, x, y){
		this.grid=grid;
		this.x=x;
		this.y=y;
		this.color=null;

		this.links=[];
		this.visited=false;
	}

	getAdjacent(){
		return [
			this.x>0 					? this.grid.cells[this.x-1][this.y] : null,
			this.y>0 					? this.grid.cells[this.x][this.y-1] : null,
			this.x+1<this.grid.width	? this.grid.cells[this.x+1][this.y] : null,
			this.y+1<this.grid.height 	? this.grid.cells[this.x][this.y+1] : null,
		].filter(e=>e);
	}
}

const elems=[
	"canvas"
].reduce((a,e)=>Object.assign(a,{[e]:document.querySelector(e)}),{});

const ctx=elems.canvas.getContext("2d");

let grid;
//grid=new Grid(64,48);
//grid=new Grid(32,24);
//grid=new Grid(16,12);
grid=new Grid(8,6);
grid.render(ctx);
