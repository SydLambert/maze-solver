/*
	Cell objects represent the individual cells within a grid. All the Cell objects are stored in a
	multidimensional array in the 'cells' property of a Grid object. Cell objects describe a cell's
	place in 2D space, its appearance, and any metadata needed by the generation and solving
	algorithms.
*/
class Cell{
	constructor(grid, x, y){
		this.grid=grid; //The parent grid object
		this.x=x; //The cell's x coordinate in the grid, not in the render context
		this.y=y; //The cell's y coordinate in the grid, not in the render context
		this.color=null; //A color value assigned to specific cells to highlight them

		//Properties for the generator
		this.links=[]; //All neighboring cells that are not blocked by a wall
		this.visited=false; //Whether the recursive backtracker has visited this cell

		//Properties for the solver
		this.globalGoal=Infinity; //How close the current cell is to the end with the current path
		this.localGoal=Infinity;//The viability of this cell in the path relative to cells around it
		this.parent=null; //The cell that came before the current cell in the solution path
		this.mapped=false; //Whether the cell has been mapped by the solving algorithm
	}

	/*
		'getAdjacent' returns an array of all the direct neighbors of this cell in the grid. Each
		cardinal direction is checked, and null is added to the array if there is no cell in a given
		direction. The array is then filtered to only contain Cell objects.
	*/
	getAdjacent(){
		return [
			this.x>0 ? this.grid.cells[this.x-1][this.y] : null, //West
			this.y>0 ? this.grid.cells[this.x][this.y-1] : null, //North
			this.x+1<this.grid.width ? this.grid.cells[this.x+1][this.y] : null, //East
			this.y+1<this.grid.height ? this.grid.cells[this.x][this.y+1] : null, //South
		].filter(e=>e);
	}

	/*
		Returns the Manhattan distance to a given location on the grid. I wanted a function that
		could handle either coordinates or a Cell object as arguments, but there is no overloading
		in Javascript so the function just switches behaviour depending on whether the first
		argument is an instance of the Cell class, such that the following code works:
			let cell=new Cell(null, 2, 1);
			let cell2=new Cell(null, 5, 3)
			cell.distanceTo(5, 3) == cell.distanceTo(cell2) //true (5 == 5)
	*/
	distanceTo(x, y){
		if(x instanceof Cell){
			let cell=x;
			return this.distanceTo(cell.x,cell.y);
		}
		else{
			return Math.abs(this.x-x)+Math.abs(this.y-y);
		}
	}

	/*
		A recursive function to draw a line from the current cell to its parent cell, and from that
		cell to its parent cell, etc. It takes a rendering context and a width and a height as its
		arguments. The width and the height represent the width and height of cells as they are
		rendered by the Grid object. It is expected that a line path is begun before this method is
		called.
	*/
	lineParents(ctx, cellWidth, cellHeight){
		/*
			Checks to ensure this cell isn't the first cell in the maze. The starting cell can never
			have a parent, so the algorithm stops here.
		*/
		if(this.parent!=null){
			/*
				Draws a line from the center of this cell to the center of the parent cell.
			*/
			ctx.lineTo(
				Math.ceil((this.parent.x*cellWidth)+cellWidth/2),
				Math.ceil((this.parent.y*cellHeight)+cellHeight/2)
			);
			/*
				Calls this same method on the parent cell, with the same arguments. This creates the
				recursive loop that draws a path through all parents that came before the current
				cell.
			*/
			this.parent.lineParents(ctx, cellWidth, cellHeight);
		}
	}
}
