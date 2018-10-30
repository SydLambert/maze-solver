/*
	Grid is the main class in this program. It contains a multidimensional array of Cell objects and
	the necessary methods for generating and solving mazes with these Cells.
*/
class Grid{
	/*
		The constructor creates a multidimensional array in the 'cells' property with the specified
		width and height. It fills the array with new Cell objects to form the maze grid.
	*/
	constructor(width=4, height=3){
		this.width=width; //Length of the 'cells' array
		this.height=height; //Length of the arrays within the 'cells' array

		this.cells=[]; //A two dimensional array containing Cell objects that represent the grid
		for(let x=0;x<this.width;x++){
			this.cells.push([]);
			for(let y=0;y<this.height;y++){
				/*
					Creates a new Cell with the current Grid as its parent grid, and its x and y
					coordinates within the current Grid's 'cells' 2D array.
				*/
				this.cells[x].push(new Cell(this, x, y));
			}
		}
	}

	/*
		The maze generator uses a recursive backtracker to create links between Cell objects and
		create a maze. The links are stored in the 'links' property in each Cell and form an
		undirected graph of nodes representing the maze. It accepts a rendering context and a delay
		as its arguments. The rendering context, if supplied, is where each step of the maze
		generation will be rendered. The delay argument limits the speed of the generation so
		it can be seen by the user. The function is asynchronous as to not hang the main thread. The
		delay is in milliseconds.
	*/
	async generateMaze(ctx, delay=1){
		/*
			The function will only respond to stop requests if a rendering context and a delay are
			speficied. This is set up at the start of the function.
		*/
		if(ctx && delay>0) stop=false;

		/*
			The stack holds all the cells that are to be visited by the algorithm. It starts out
			holding the very upper-left cell, which is the starting point for the maze. Cells are
			pushed to the stack as they are discovered and popped from the stack once they have been
			visited and have no more undiscovered adjacent cells to link to. The maze generation is
			complete when the stack is clear.
		*/
		let stack=[this.cells[0][0]];
		while(stack.length){
			let top=stack[stack.length-1]; //The top of the stack, the "last in" Cell
			top.visited=true;
			/*
				The following code will only apply if a rendering context has been supplied, it
				handles drawing the generation procedure to the screen for the user to see.
			*/
			if(ctx && delay>0){
				top.mapped=true; //This boolean dictates whether the cell is highlighted yellow
				render(this, ctx); //The render method in index.js is called with this Grid and ctx
				top.mapped=false; //The 'mapped' property is actually used by A*, so it is reset
				/*
					The following Promise creates an artificial delay between each frame so the user
					has time to see them. It uses Window.setTimeout as to not hang the main thread,
					and uses async/await to avoid unnecessary callback functions.
				*/
				await new Promise(resolve=>setTimeout(()=>resolve(),delay));
				/*
					Handles the action taken when a stop is requested. Simply ends the function
					with a return statement and resets the stop flag for future use.
				*/
				if(stop){
					stop=false;
					return;
				}
			}
			/*
				Gets all directly adjacent cells that haven't yet been visited by the algorithm.
			*/
			let adjacent=top.getAdjacent().filter(e=>!e.visited);
			if(adjacent.length){
				/*
					Out of all the neighboring cells that haven't been visited, a random one is
					chosen and a link is made from the current cell to that neighbor. That neighbor
					is then added to the stack to create links from that cell to its neighbors, and
					so on until all cells have a link to at least one other cell. All these links
					can be followed to create a maze structure.
				*/
				let link=adjacent[Math.floor(Math.random()*adjacent.length)];
				top.links.push(link);
				stack.push(link);
			}
			/*
				If there are no adjacent cells that haven't been visited by the algorithm, this
				current cell no longer matters and can be removed from the stack.
			*/
			else{
				stack.pop();
			}
		}
	}

	/*
		The 'solveMaze' method implements the A* algorithm with parameters that are able to alter
		the way the algorithm functions in order to emulate a greedy A* and Dijkstra's algorithm.
		Dijkstra's algorithm is emulated by disabling the Manhattan distance heuristic. It also
		accepts a rendering context and a delay so that the progress of the algorithm can be shown
		to the user as it executes. The delay is in milliseconds.
	*/
	async solveMaze(ctx,{
		delay=1, //The delay, in milliseconds, for each step of the algorithm.
		greedy=false, //If it will continue searching for a better solution once one is found
		heuristic=true, //Enables or disables the manhattan distance heuristic.
	}={}){
		/*
			The function will only respond to stop requests if a rendering context and a delay are
			speficied. This is set up at the start of the function.
		*/
		if(ctx && delay>0) stop=false;

		/*
			The algorithm treats the different Cell objects in the Grid as nodes in an undirected
			graph. The 'nodes' array holds the discovered, but untested, nodes in the graph. A
			node is tested by assigning local and global goals to all its child nodes (the cells
			that link from the current node). The current node is also assigned as the child's
			parent node if its local goal+1 is less than than the child's local goal.

			The 'nodes' array is initialized to contain only the starting cell in the top-left of
			the grid.
		*/
		let nodes=[this.cells[0][0]];
		/*
			'end' holds a quick reference to the ending cell in the bottom right of the grid. This
			is used to find the end of the maze and to calculate the Manhattan distance heuristic
			for the A* algorithm.
		*/
		let end=this.cells[this.width-1][this.height-1];
		/*
			The global and local goals for the starting cell are initialized so that the program can
			begin solving the maze from there.
		*/
		nodes[0].globalGoal=this.width+this.height-2;
		nodes[0].localGoal=0;
		/*
			If a greedy algorithm is chosen, the algorithm will continue until all nodes in the
			graph have been mapped. If the algorithm is non-greedy, it will only continue until the
			ending cell has been reached.
		*/
		while((greedy && nodes.length) || (nodes.length && !end.mapped)){
			let current=nodes[0]; //The current node is the first element in the node list.
			if(!current.mapped){ //The cell is mapped if it has not yet been visited.
				current.links.forEach(child=>{
					/*
						All child nodes that link from the current parent node are added to the
						node list to be tested by the algorithm.
					*/
					nodes.push(child);
					/*
						The current local goal +1 is compared to the child's current local goal.
						The +1 is a single unit representing the distance between cells. This is
						arbitrary and the same for all cells. All local goals of child nodes start
						out at infinity, so this condition will always be met on the first pass.
					*/
					if(current.localGoal+1 < child.localGoal){
						/*
							The absolute distance between the current cell path and the child is
							lower than what the child currently has as its local goal, so the
							current cell is assigned as the child's parent and the local goal is
							updated.
						*/
						child.parent=current;
						child.localGoal=current.localGoal+1;
					}
					/*
						The global goal is assigned to the local goal plus a heuristic if it is
						enabled. The heuristic is the manhattan distance to the end cell. If the
						heuristic is disabled, all cells are considered equally valid so a single
						unit is added.
					*/
					child.globalGoal=child.localGoal+(heuristic ? child.distanceTo(end) : 1);
				});
				current.mapped=true; //The algorithm has now visited the current node, it is marked.
			}
			/*
				The first cell is removed from the node list because it has been mapped, then all
				the nodes are sorted based on their local goal. This gives the algorithm the best
				chance of finding the shortest path on the first try.
			*/
			nodes.splice(0,1);
			nodes.sort((a,b)=>a.globalGoal-b.globalGoal);
			/*
				The following code will only apply if a rendering context has been supplied, it
				handles drawing the generation procedure to the screen for the user to see.
			*/
			if(ctx && delay>0){
				render(this, ctx);
				/*
					The following Promise creates an artificial delay between each frame so the user
					has time to see them. It uses Window.setTimeout as to not hang the main thread,
					and uses async/await to avoid unnecessary callback functions.
				*/
				await new Promise(resolve=>setTimeout(()=>resolve(),delay));
				/*
					Handles the action taken when a stop is requested. Simply ends the function
					with a return statement and resets the stop flag for future use.
				*/
				if(stop){
					stop=false;
					return;
				}
			}
		}
	}
}
