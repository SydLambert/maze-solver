class Cell{
	constructor(grid, x, y){
		this.grid=grid;
		this.x=x;
		this.y=y;
		this.color=null;

		this.links=[];
		this.visited=false;

		this.globalGoal=Infinity;
		this.localGoal=Infinity;
		this.parent=null;
		this.mapped=false;
	}

	getAdjacent(){
		return [
			this.x>0 ? this.grid.cells[this.x-1][this.y] : null,
			this.y>0 ? this.grid.cells[this.x][this.y-1] : null,
			this.x+1<this.grid.width ? this.grid.cells[this.x+1][this.y] : null,
			this.y+1<this.grid.height ? this.grid.cells[this.x][this.y+1] : null,
		].filter(e=>e);
	}

	distanceTo(x, y){
		if(x instanceof Cell){
			let cell=x;
			return this.distanceTo(cell.x,cell.y);
		}
		else{
			return Math.abs(this.x-x)+Math.abs(this.y-y);
		}
	}

	lineParents(ctx, cellWidth, cellHeight){
		if(this.parent!=null){
			ctx.lineTo(
				Math.ceil((this.parent.x*cellWidth)+cellWidth/2),
				Math.ceil((this.parent.y*cellHeight)+cellHeight/2)
			);
			this.parent.lineParents(ctx, cellWidth, cellHeight);
		}
	}
}
