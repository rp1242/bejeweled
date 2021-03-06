import React, { Component } from "react";
import Gem from "../Gem/Gem";
import Tile from "../Tile/Tile";
import classes from "./Game.module.css";
import Button from "../Button/Button";
import Button_Container from "../Button_Container/Button_Container";

import Background_Image from "../assets/space_darkened.png";
// import DigitalDisplay from "../DigitalDisplay/DigitalDisplay";
import Score from "../Score/Score";
import UIContainer from "../UIContainer/UIContainer";
import Spinner from "../Spinner/Spinner";
import Preloader from "../Preloader/Preloader";

class Game extends Component {
  state = {
    gems: [],
    newGems: [],
    checkerboard: null,
    height: 8,
    width: 8,
    tileSize: 65,
    margin: 0,
    marginLeft: 0,
    activeTile: false, //contains 2d index of which tile is active
    clickHandlerActive: false, //true means animation is in progress
    newGemId: 0, //gemId used for the next newly created gem during the game, increments for every new gem
    matchedOnLevel: [], //2d coordinate of matched gems
    displayGems: false,
    animate: false,
    noMoves: false,
    initializing: true,
    initialSearchComplete: false,
    numGemTypes: 7,
    score: 0,
    loaded: false
  };

  searchState = {
    matchedGems: [], //2d location of gems in a group
    emptyTiles: [],
    potentialMoves: [],
    level: null,
    hintActive: false,
    consecutiveMatches: 0
  };

  hintState = {
    hintLocation: false
  };

  constructor() {
    super();
    this.reset(true);
  }

  reset = constructor => {
    console.log("reset method");
    this.state.initializing = true;
    let marginLeft =
      this.state.tileSize * this.state.height * 0.875 - 0.5 * this.state.margin;
    //initialize level array
    let row = [];
    let checkerboardRow = [];
    let level = [];
    let checkerboard = [];
    let matchedRow = [];
    let matchedOnLevel = [];
    let k = this.state.newGemId;
    let gems = [];
    for (let i = 0; i < this.state.height; i++) {
      row = [];
      checkerboardRow = [];
      matchedRow = [];
      for (let j = 0; j < this.state.width; j++) {
        matchedRow.push(false);
        gems.push({
          gemId: k,
          gemType: Math.floor(Math.random() * this.state.numGemTypes),
          selected: false,
          index: [i, j],
          dead: false,
          hint: false
        });
        row.push({
          gemId: k
        });
        checkerboardRow.push({
          color: j % 2 ^ i % 2 ? "white" : "black"
        });
        k++;
      }
      level.push(row);
      checkerboard.push(checkerboardRow);
      matchedOnLevel.push(matchedRow);
    }
    if (constructor) {
      this.state.newGemId = k;
      this.searchState.level = level;
      this.state.gems = gems;
      this.state.checkerboard = checkerboard;
      this.state.marginLeft = marginLeft;
      this.state.matchedOnLevel = matchedOnLevel;
      setTimeout(() => {
        this.searchAll();
      }, 0);
      // this.searchAll();
    } else {
      this.searchState.level = level;
      this.setState(
        {
          newGemId: k,
          gems: gems,
          checkerboard: checkerboard,
          marginLeft: marginLeft,
          matchedOnLevel: matchedOnLevel
        },
        () => {
          setTimeout(() => {
            this.searchAll();
          }, 0);
        }
      );
    }
    setTimeout(() => {
      this.setLevelEmpty();
      this.convertGemsToNewGems();
      if (constructor) {
        this.state.animate = true;
        this.state.score = 0;
        this.handleMatched();
      } else {
        this.setState({ animate: true, score: 0 }, () => {
          // this.shrinkAllGems();
          // setTimeout(() => {
          this.handleMatched();
          // }, 300); //wait for gems to shrink
        });
      }
    }, 2);
    // this.setLevelEmpty();
    console.log("constructor");
    console.log("this.searchState.level");
    console.log(this.searchState.level);
  };

  resetHandler = () => {
    console.log("resetHandler");
    this.shrinkAllGems();
    setTimeout(() => {
      this.setState({ animate: false, displayGems: false }, this.reset(false));
    }, 300); //wait for gems to shrink
  };

  // componentDidMount() {
  //   setTimeout(() => {
  //     alert("hello, world!");
  //   }, 4000);
  // }

  copyArray = a => {
    let copiedArray = a.map(x => {
      if (Array.isArray(x)) return this.copyArray(x);
      else return x;
    });
    return copiedArray;
  };

  findGemOnLevel = gemId => {
    for (let i = 0; i < this.state.height; i++) {
      for (let j = 0; j < this.state.width; j++) {
        if (this.searchState.level[i][j].gemId === gemId) {
          return [i, j];
        }
      }
    }
    console.log("error finding gem on level!");
  };

  initializeGems = () => {
    let gemArray = [];

    this.state.gems.forEach(gem => {
      gemArray.push(
        <Gem
          key={gem.gemId}
          gemId={gem.gemId}
          selected={gem.selected}
          size={this.state.tileSize}
          index={gem.index}
          pos={{
            left: gem.index[1] * this.state.tileSize,
            top: gem.index[0] * this.state.tileSize
          }}
          clickHandler={index => this.clickHandler(index)}
          gem={gem.gemType}
          dead={gem.dead}
          hint={gem.hint}
        />
      );
    });

    return gemArray;
  };

  setLevelEmpty = () => {
    for (let i = 0; i < this.state.height; i++) {
      for (let j = 0; j < this.state.width; j++) {
        this.searchState.level[i][j].gemId = "empty";
      }
    }
  };

  convertGemsToNewGems = () => {
    console.log("convertGemsToNewGems");
    console.log(this.state.gems);
    let gemsCopy = this.copyArray(this.state.gems);
    gemsCopy.forEach(gem => {
      gem.index = [gem.index[0] - 9, gem.index[1]];
    });
    this.setState({ gems: gemsCopy, newGems: this.sortNewGems(gemsCopy) });
    console.log(gemsCopy);
  };

  shrinkAllGems = () => {
    let gemsCopy = this.copyArray(this.state.gems);
    gemsCopy.forEach(gem => {
      gem.dead = true;
    });
    this.setState({ gems: gemsCopy });
  };

  drawCheckerboard = () => {
    let checkerboardArray = [];
    let checkerboardRow = [];
    for (let i = 0; i < this.state.height; i++) {
      for (let j = 0; j < this.state.width; j++) {
        checkerboardRow.push(
          <div
            key={i.toString().padStart(2, "0") + j.toString().padStart(2, "0")}
          >
            <Tile
              color={this.state.checkerboard[i][j].color}
              size={this.state.tileSize}
              pos={{
                left: j * this.state.tileSize,
                top: i * this.state.tileSize
              }}
            />
          </div>
        );
      }
      checkerboardArray.push(checkerboardRow);
    }
    return checkerboardArray;
  };

  findAdjacentTiles = index => {
    return {
      top: [index[0] - 1, index[1]],
      bottom: [index[0] + 1, index[1]],
      right: [index[0], index[1] + 1],
      left: [index[0], index[1] - 1]
    };
  };

  isAdjacent = index => {
    let adjacentTiles = this.findAdjacentTiles(this.state.activeTile);
    let val =
      (index[0] === adjacentTiles.left[0] &&
        index[1] === adjacentTiles.left[1]) ||
      (index[0] === adjacentTiles.right[0] &&
        index[1] === adjacentTiles.right[1]) ||
      (index[0] === adjacentTiles.top[0] &&
        index[1] === adjacentTiles.top[1]) ||
      (index[0] === adjacentTiles.bottom[0] &&
        index[1] === adjacentTiles.bottom[1]);
    // console.log("isAdjacent: " + val);
    return val;
  };

  //return index value of gem in gem array with given gemId
  getGemIndex = (gemId, gemsCopy) => {
    // console.log("inside getGemIndex with value " + gemId);

    if (!gemsCopy) {
      for (let i = 0; i < this.state.gems.length; i++) {
        if (this.state.gems[i].gemId === gemId) {
          // console.log("found gem at index " + i);
          return i;
        }
      }
      console.log("gem handling error 1!");
      console.log("gemId");
      console.log(gemId);
    } else {
      for (let i = 0; i < gemsCopy.length; i++) {
        if (gemsCopy[i].gemId === gemId) {
          // console.log("found gem at index " + i);
          return i;
        }
      }
      console.log("gem handling error 2!");
      console.log("gemId");
      console.log(gemId);
    }
  };

  //swaps values in 2d level array and 1d gems array
  swapPositions = (a, b) => {
    // console.log("swapping positions [" + a + "], [" + b + "]");
    // console.log("level's current value: ");
    // console.log(this.searchState.level);
    let temp;
    let a_index = this.getGemIndex(this.searchState.level[a[0]][a[1]].gemId);
    let b_index = this.getGemIndex(this.searchState.level[b[0]][b[1]].gemId);
    let gemsCopy = this.copyArray(this.state.gems);
    let levelCopy = this.searchState.level;
    temp = levelCopy[a[0]][a[1]].gemId;
    levelCopy[a[0]][a[1]].gemId = levelCopy[b[0]][b[1]].gemId;
    levelCopy[b[0]][b[1]].gemId = temp;
    // console.log("new level value: ");
    // console.log(levelCopy);

    gemsCopy[a_index].index = b;
    gemsCopy[b_index].index = a;
    this.setState({ gems: gemsCopy });
  };

  swapBackAndForth = (a, b) => {
    this.swapPositions(a, b);
    if (!this.state.animate) this.swapPositions(a, b);
    else {
      setTimeout(() => {
        this.swapPositions(a, b);
      }, 350); //350
    }
  };

  moveTo = (gemId, location, onLevel) => {
    let gemIndex;
    let gemsCopy;
    if (!onLevel) {
      gemIndex = this.getGemIndex(gemId);
      gemsCopy = this.copyArray(this.state.gems);
      gemsCopy[gemIndex].index = location;
      this.setState({ gems: gemsCopy });
    }
  };

  //sets gem selected at index in level array to isSelected (boolean)
  setGemActive = (index, isSelected) => {
    console.log("-==========setGemActive==========-");
    let gemId = this.searchState.level[index[0]][index[1]].gemId;
    let gemIndex = this.getGemIndex(gemId);
    let gemsCopy = this.copyArray(this.state.gems);
    gemsCopy[gemIndex].selected = isSelected;
    let activeTile = isSelected ? index : false;
    this.setState({ gems: gemsCopy, activeTile: activeTile });
  };

  //returns gem type (number 0 to 6) at index location in level array
  getGemType = index => {
    let gemIndex = this.getGemIndex(
      this.searchState.level[index[0]][index[1]].gemId
    );
    return this.state.gems[gemIndex].gemType;
  };

  getAdjacentTile = (loc, dir) => {
    if (dir === "left" && loc[1] - 1 >= 0) {
      return [loc[0], loc[1] - 1];
    } else if (dir === "right" && loc[1] + 1 < this.state.width) {
      return [loc[0], loc[1] + 1];
    } else if (dir === "up" && loc[0] - 1 >= 0) {
      return [loc[0] - 1, loc[1]];
    } else if (dir === "down" && loc[0] + 1 < this.state.height) {
      return [loc[0] + 1, loc[1]];
    } else return false;
  };

  getSearchStatus = loc => {
    return this.searchState[loc[0]][loc[1]];
  };

  getMatchingGemsInDir = (loc, dir, gemType, gemsArray) => {
    let adjacentTile = this.getAdjacentTile(loc, dir);
    // this.searchState;
    if (adjacentTile && this.getGemType(adjacentTile) === gemType) {
      //   if (this.state.matchedOnLevel[adjacentTile[0]][adjacentTile[1]] === true)
      //     return gemsArray; //check if current tile already belongs to another group
      gemsArray.push(adjacentTile);
      return this.getMatchingGemsInDir(adjacentTile, dir, gemType, gemsArray);
    } else return gemsArray;
  };

  //set each matching gem as true at its index value on 2d array searchState.matchedOnLevel
  setMatchedOnLevel = gems => {
    let matchedOnLevelCopy = this.copyArray(this.state.matchedOnLevel);
    gems.forEach(gem => {
      matchedOnLevelCopy[gem[0]][gem[1]] = true;
    });
    this.setState({ matchedOnLevel: matchedOnLevelCopy });
  };

  clearMatchedOnLevel = () => {
    let newMatchedOnLevel = [];
    let newMatchedOnLevelRow = [];
    for (let i = 0; i < this.state.height; i++) {
      newMatchedOnLevelRow = [];
      for (let j = 0; j < this.state.width; j++) {
        newMatchedOnLevelRow.push(false);
      }
      newMatchedOnLevel.push(newMatchedOnLevelRow);
    }
    this.setState({ matchedOnLevel: newMatchedOnLevel });
  };

  clearPotentialMoves = () => {
    this.searchState.potentialMoves = [];
  };

  swapOnLevelArray = (loc1, loc2) => {
    let temp = this.searchState.level[loc1[0]][loc1[1]];
    this.searchState.level[loc1[0]][loc1[1]] = this.searchState.level[loc2[0]][
      loc2[1]
    ];
    this.searchState.level[loc2[0]][loc2[1]] = temp;
  };

  findMoves = () => {
    console.log("findMoves");
    for (let i = 0; i < this.state.height; i++) {
      for (let j = 0; j < this.state.width; j++) {
        let loc = [i, j];
        if (
          this.findMove(loc, "up") ||
          this.findMove(loc, "down") ||
          this.findMove(loc, "left") ||
          this.findMove(loc, "right")
        ) {
          this.searchState.potentialMoves.push(loc);
        }
      }
    }
    console.log("====================findMoves====================");
    console.log(this.searchState.potentialMoves);
  };

  findMove = (loc, dir) => {
    let gemType = this.getGemType(loc);
    let adjacentTile = this.getAdjacentTile(loc, dir);
    if (adjacentTile) {
      this.swapOnLevelArray(loc, adjacentTile);
      if (this.getMatchedGroup(adjacentTile, gemType, true)) {
        console.log("moveFound: move " + loc + " to " + adjacentTile);
        this.swapOnLevelArray(loc, adjacentTile);
        return true;
      }
      this.swapOnLevelArray(loc, adjacentTile);
    }
    return false;
  };

  //searches for a group of matching gems adjacent to loc
  //puts array of matching gem 2d index values into searchState.matchedGems
  getMatchedGroup = (loc, gemType, findMoves) => {
    if (!gemType) gemType = this.getGemType(loc);
    //horitontal
    let leftGems = this.getMatchingGemsInDir(loc, "left", gemType, []);
    let rightGems = this.getMatchingGemsInDir(loc, "right", gemType, []);
    let horizontalGems = leftGems.concat(rightGems);
    //vertical
    let topGems = this.getMatchingGemsInDir(loc, "up", gemType, []);
    let bottomGems = this.getMatchingGemsInDir(loc, "down", gemType, []);
    let verticalGems = topGems.concat(bottomGems);

    if (!findMoves) {
      if (horizontalGems.length >= 2 && verticalGems.length >= 2) {
        let matchedGems = verticalGems.concat(horizontalGems);
        matchedGems.push(loc);
        this.searchState.matchedGems.push(matchedGems);
        this.setMatchedOnLevel(matchedGems);
        return matchedGems;
      } else if (horizontalGems.length >= 2) {
        horizontalGems.push(loc);
        this.searchState.matchedGems.push(horizontalGems);
        this.setMatchedOnLevel(horizontalGems);
        return horizontalGems;
      } else if (verticalGems.length >= 2) {
        verticalGems.push(loc);
        this.searchState.matchedGems.push(verticalGems);
        this.setMatchedOnLevel(verticalGems);
        return verticalGems;
      }
      return false;
    } else return horizontalGems.length >= 2 || verticalGems.length >= 2;
  };

  shrinkMatched = () => {
    // console.log("inside shrinkMatched!");
    if (this.searchState.matchedGems.length === 0) return;
    let gemsCopy;
    this.searchState.matchedGems.forEach(group => {
      //   console.log(group);
      group.forEach(gem => {
        // console.log(gem);
        let gemId = this.searchState.level[gem[0]][gem[1]].gemId;
        let gemIndex = this.getGemIndex(gemId);
        gemsCopy = this.copyArray(this.state.gems);
        gemsCopy[gemIndex].dead = true;
      });
    });
    this.setState({ gems: gemsCopy });
  };

  //deletes gems in gems array
  deleteGems = () => {
    console.log("-==========deleteGems==========-");
    console.log("matched gems: ");
    console.log(this.searchState.matchedGems);
    let levelCopy = this.searchState.level;
    let gemIndex;
    let gemId;
    let gemsCopy = this.copyArray(this.state.gems);
    if (this.searchState.matchedGems.length === 0) {
      console.log("nothing to delete!");
      return;
    } else {
      console.log("deleting gems . . . ");
    }
    let uniqueList = this.createUniqueGemList(this.searchState.matchedGems);
    uniqueList.forEach(gem => {
      console.log("gem");
      console.log(gem);
      gemId = levelCopy[gem[0]][gem[1]].gemId;
      levelCopy[gem[0]][gem[1]].gemId = "empty";
      gemIndex = this.getGemIndex(gemId, gemsCopy);
      console.log("deleting gemId " + gemId + " with index " + gemIndex);
      gemsCopy.splice(gemIndex, 1);
    });

    this.setState({ gems: gemsCopy });
  };

  createUniqueGemList = matchedGems => {
    let unfilteredList = [];
    let uniqueList = [];
    matchedGems.forEach(group => {
      group.forEach(gem => {
        unfilteredList.push(gem);
      });
    });

    unfilteredList.forEach(x => {
      let match = false;
      for (let i = 0; i < uniqueList.length; i++) {
        if (x[0] === uniqueList[i][0] && x[1] === uniqueList[i][1]) {
          match = true;
        }
      }
      if (!match) uniqueList.push(x);
    });

    return uniqueList;
  };

  //new gems are stored in the state.gems array
  createNewGems = () => {
    console.log("-====================createNewGems====================-");
    if (this.searchState.matchedGems.length === 0) return;
    let newGems = [];
    let newGemId = this.state.newGemId;
    let gemsCopy = this.copyArray(this.state.gems);
    // let duplicateFound;

    //keeps track of the number of new gems in each column
    let colCount = [];
    for (let i = 0; i < this.state.width; i++) {
      colCount.push(0);
    }

    //create unique list of gems
    let uniqueGemsList = this.createUniqueGemList(this.searchState.matchedGems);

    uniqueGemsList.forEach(gem => {
      colCount[gem[1]]++;
      newGems.push({
        gemId: newGemId,
        gemType: Math.floor(Math.random() * this.state.numGemTypes),
        selected: false,
        // index: [-1, gem[1]],
        index: [-1 - colCount[gem[1]], gem[1]],
        dead: false
      });
      newGemId++;
    });

    newGems.forEach(gem => {
      gemsCopy.push(gem);
    });

    console.log("newGems");
    console.log(newGems);
    console.log("newGems has " + newGems.length + " elements");
    this.setState({
      newGems: this.sortNewGems(newGems),
      newGemId: newGemId,
      gems: gemsCopy
    });
  };

  shiftDownCol = () => {
    console.log("-==========shiftDownCol==========-");
    console.log("columns");
    // array containing all columns that need shifting down
    let col = this.findColWithEmpty();
    console.log(col);
    let newCol = [];
    let levelCopy = this.searchState.level;
    let gemsCopy = this.copyArray(this.state.gems);
    let gemIndex;

    if (col.length === 0) return;

    col.forEach(c => {
      console.log("c: " + c);
      newCol = [];
      let currentPos = this.state.height - 1;
      for (let i = this.state.height - 1; i >= 0; i--) {
        if (levelCopy[i][c].gemId !== "empty") {
          console.log("gemId");
          console.log(levelCopy[i][c].gemId);
          console.log("i: " + i + " c: " + c);
          newCol.splice(0, 0, levelCopy[i][c].gemId);
          gemIndex = this.getGemIndex(levelCopy[i][c].gemId, gemsCopy);
          console.log("gemIndex");
          console.log(gemIndex);
          gemsCopy[gemIndex].index = [currentPos, c]; //move gem to new position
          currentPos--;
        }
      }

      while (newCol.length < this.state.height) {
        newCol.splice(0, 0, "empty"); //add 'empty' to top elements of column that haven't been filled inA
      }
      for (let i = 0; i < this.state.height; i++) {
        levelCopy[i][c].gemId = newCol[i];
        console.log("new levelCopy");
        console.log(levelCopy);
      }
      console.log("newCol");
      console.log(newCol);
      this.setState({ gems: gemsCopy });
    });
  };

  findColWithEmpty = () => {
    let cols = [];
    this.searchState.matchedGems.forEach(group => {
      group.forEach(gem => {
        cols.push(gem[1]);
      });
    });
    return [...new Set(cols)];
  };

  compareGemPositions = (a, b) => {
    return a.index[0] > b.index[0] ? 1 : a.index[0] === b.index[0] ? 0 : -1;
  };

  sortNewGems = gems => {
    console.log("-==========sortNewGems==========-");
    let sortedGems = [];
    for (let i = 0; i < this.state.width; i++) {
      sortedGems[i] = [];
    }

    let col;
    gems.forEach(gem => {
      col = gem.index[1];
      sortedGems[col].push(gem);
    });

    sortedGems.forEach(col => {
      col.sort(this.compareGemPositions);
    });
    console.log("sorted gems");
    console.log(sortedGems);
    return sortedGems;
  };

  positionNewGems = () => {
    console.log("-==========positionNewGems==========-");
    let firstEmpty;
    let gemIndex;
    let gemsCopy = this.copyArray(this.state.gems);
    let levelCopy = this.searchState.level;

    console.log(this.state.newGems);

    this.state.newGems.forEach((col, i) => {
      console.log("-===============col===============-");
      console.log(col);
      if (col.length > 0) {
        for (let k = this.state.height - 1; k >= 0; k--) {
          if (levelCopy[k][i].gemId === "empty") {
            firstEmpty = k;
            // console.log("firstEmpty");
            // console.log(firstEmpty);
            break;
          }
        }

        col.forEach(gem => {
          console.log("gem");
          console.log(gem);
          console.log("gem.index");
          console.log(gem.index);
          console.log("levelCopy");
          console.log(levelCopy);
          console.log("gemId");
          console.log(gem.gemId);
          console.log("firstEmpty");
          console.log(firstEmpty);
          console.log("levelCopy[firstEmpty]");
          console.log(levelCopy[firstEmpty]);
          console.log("this.state.gems");
          console.log(this.state.gems);

          //   if (firstEmpty >= 0) {
          gemIndex = this.getGemIndex(gem.gemId);
          gemsCopy[gemIndex].index = [firstEmpty, i];
          levelCopy[firstEmpty][i].gemId = gem.gemId;
          firstEmpty--;
          //   }
        });
      }
    });
    this.setState({ gems: gemsCopy });
  };

  handleMatched = reset => {
    this.countMatchedType();
    this.shrinkMatched();
    console.log("after shrinkMatched");
    console.log(this.searchState.matchedGems);
    if (!this.state.animate) {
      if (!reset) {
        this.deleteGems();
        this.createNewGems();
      }
      this.shiftDownCol();
      this.positionNewGems();
      this.clearMatchedGems();
      this.clearMatchedOnLevel();
      // this.setState({ clickHandlerActive: false });
    } else {
      setTimeout(
        () => {
          //   debugger;
          console.log("inside timeout");
          console.log(this.searchState.matchedGems);
          if (!reset) {
            this.deleteGems();
            this.createNewGems();
          }
          this.shiftDownCol();
          //shiftDownCol
          //createNewGems
          //   this.positionNewGems();
          setTimeout(() => {
            this.positionNewGems();
            this.clearMatchedGems();
            this.clearMatchedOnLevel();
            this.setState({ clickHandlerActive: false, initializing: false });
          }, 1); //time for old gems to reposition (1)
        },
        this.state.initializing ? 1 : 300
        // reset ? 300 : 1
      ); //time for gems to move and shrink (300)
    }

    //change gemId in level array to 'empty'
    //remove gem with gemId from gems array
    //create new gems positioned at corresponding columns with row value -1
    //slide existing gems down to empty
    //put gems in level array and gems array
    //move new gems to the top
  };

  //delete index references to matched gems
  clearMatchedGems = () => {
    this.searchState.matchedGems = [];
  };

  searchAroundGem = index => {
    // console.log("-==========searchAroundGem==========-");
    let found = false;
    this.getMatchedGroup(index);
    if (this.searchState.matchedGems.length > 0) {
      found = true;
    }
    return found;
  };

  searchAll = () => {
    if (this.state.animate) this.setState({ clickHandlerActive: true });
    this.searchState.consecutiveMatches++;
    console.log("-====================searchAll====================-");
    let found = false;
    for (let i = 0; i < this.state.height; i++) {
      for (let j = 0; j < this.state.width; j++) {
        // if (!this.state.matchedOnLevel[i][j]) {
        if (this.searchAroundGem([i, j])) {
          found = true;
          // console.log("found match at " + [i, j]);
          //   break;
        }
        // }
      }
      //   if (found) break;
    }

    if (found) {
      // console.log(
      //   "this.searchState.matchedGems has " +
      //     this.searchState.matchedGems.length +
      //     " elements!"
      // );
      console.log(this.searchState.matchedGems);
      this.handleMatched(false);
      //   this.clearMatchedOnLevel();
      if (!this.state.animate) this.searchAll();
      else {
        setTimeout(() => {
          this.searchAll();
        }, 800);
      }
    } else {
      this.searchState.consecutiveMatches = 0;
      this.setState({
        clickHandlerActive: false,
        displayGems: true,
        animate: true,
        initialSearchComplete: true
      });
      // this.findMoves();
      this.findMoves();
      if (this.searchState.potentialMoves.length === 0) {
        this.setState({ noMoves: true });
      }
      this.clearHint();
      this.clearPotentialMoves();
    }
  };

  doClickHandling = index => {
    if (!this.state.activeTile) {
      // if no gem is selected, set gem to selected (active)
      //   console.log("setting tile " + index + " to selected: true!");
      this.setGemActive(index, true);
    } else if (
      //if tile is active and non vertically/horizontally adjacent tile is clicked, change activeTile
      (index[0] !== this.state.activeTile[0] ||
        index[1] !== this.state.activeTile[1]) &&
      !this.isAdjacent(index)
    ) {
      this.setGemActive(this.state.activeTile, false);
      this.setGemActive(index, true);
      //   this.setState({ activeTile: false, level: levelCopy });
    } else {
      //check if there is a group
      let tempActiveTile = this.state.activeTile;
      this.setGemActive(this.state.activeTile, false); //disable gem selection cursor while swapping positions
      this.swapPositions(tempActiveTile, index);
      if (
        !(this.getMatchedGroup(index) || this.getMatchedGroup(tempActiveTile))
      ) {
        if (!this.state.animate) this.swapPositions(tempActiveTile, index);
        else {
          setTimeout(() => {
            this.swapPositions(tempActiveTile, index);
          }, 350); //350
        }
      }
      //   console.log("-=======matching gems=======-");
      //   console.log(this.searchState.matchedGems);
    }
    // this.shrinkMatched();
    if (this.searchState.matchedGems.length > 0) {
      console.log("shrinking matched gems . . . ");
      console.log(this.searchState.matchedGems);
      this.setState({ clickHandlerActive: true });
      if (!this.state.animate) this.searchAll();
      else {
        setTimeout(() => {
          this.searchAll();
        }, 325); //325
      }
    }
  };

  clickHandler = index => {
    // let levelCopy;

    // console.log("clickHandler called from " + index + "!");
    // let gemType = this.getGemType(index);
    if (!this.state.clickHandlerActive) {
      this.doClickHandling(index);
    }

    // console.log("testing getMatchedGroup");
    // console.log(this.getMatchedGroup(index));
  };

  hintHandler = () => {
    console.log("hintHandler");
    this.findMoves();
    this.setHint();
    this.clearPotentialMoves();
  };

  setHint = () => {
    console.log("setHint");
    console.log("hintActive");
    console.log(this.searchState.hintActive);
    console.log("clickHandlerActive");
    console.log(this.state.clickHandlerActive);
    if (!this.searchState.hintActive && !this.state.clickHandlerActive) {
      this.searchState.hintActive = true;
      let gemsCopy = this.copyArray(this.state.gems);
      console.log("potential moves");
      console.log(this.searchState.potentialMoves);
      let rand = Math.floor(
        Math.random() * this.searchState.potentialMoves.length
      );
      console.log("hint = " + rand);
      let gemId = this.searchState.level[
        this.searchState.potentialMoves[rand][0]
      ][this.searchState.potentialMoves[rand][1]].gemId;
      this.hintState.hintLocation = this.searchState.potentialMoves[rand];
      console.log("gemId");
      console.log(gemId);
      let index = this.getGemIndex(gemId);
      gemsCopy[index].hint = true;
      this.setState({ gems: gemsCopy });
    }
  };

  clearHint = () => {
    console.log("clearHint");
    console.log("this.hintState.hintLocation");
    console.log(this.hintState.hintLocation);
    if (this.searchState.hintActive) {
      this.searchState.hintActive = false;
      let gemsCopy = this.copyArray(this.state.gems);
      let loc = this.hintState.hintLocation;
      let gemId = this.searchState.level[loc[0]][loc[1]].gemId;
      let index = this.getGemIndex(gemId);
      gemsCopy[index].hint = false;
      this.setState({ gems: gemsCopy });
    }
  };

  //counts the number of each type of matched gem
  countMatchedType = () => {
    console.log("-====================countMatchedType====================-");
    let uniqueList = this.createUniqueGemList(this.searchState.matchedGems);
    let matchedArray = [];
    let score = this.state.score;
    for (let i = 0; i < this.state.numGemTypes; i++) {
      matchedArray.push(0);
    }
    console.log("uniquelist");
    console.log(uniqueList);
    uniqueList.forEach(gemLoc => {
      // matchedArray[this.searchState.level[gemLoc[0]][gemLoc[1]].gemId]++;
      let gemId = this.searchState.level[gemLoc[0]][gemLoc[1]].gemId;
      console.log("gemLoc");
      console.log(gemLoc);
      let index = this.getGemIndex(gemId);
      let gemType = this.state.gems[index].gemType;
      console.log("gemType");
      console.log(gemType);
      matchedArray[gemType]++;
    });
    console.log("matchedArray");
    console.log(matchedArray);
    matchedArray.forEach(type => {
      console.log("type");
      console.log(type);
      if (type)
        score = score + (type - 2) * 15 * this.searchState.consecutiveMatches;
      console.log("consecutiveMatches");
      console.log(this.searchState.consecutiveMatches);
    });
    this.setState({ score: score });
  };

  loadHandler = () => {
    this.setState({ loaded: true });
    console.log("loadHandler called!");
  };

  render() {
    let gemArray = this.state.displayGems ? this.initializeGems() : null;
    // let gemArray = this.initializeGems();
    let checkerboard = this.drawCheckerboard();
    // let tileArray =
    // console.log(tileArray);

    let noMoves = null;

    if (this.state.noMoves) {
      noMoves = <p style={{ color: "red" }}>No moves left!</p>;
      setTimeout(() => {
        this.setState({ noMoves: false }, this.reset());
      }, 3000);
    }

    let spinner = this.state.loaded ? null : <Spinner />;

    return (
      <div>
        {spinner}
        <Preloader loadHandler={this.loadHandler} />
        <div style={{ display: this.state.loaded ? "block" : "none" }}>
          {noMoves}
          <div
            style={{
              backgroundImage: "url('" + Background_Image + "')",
              backgroundSize: "cover",
              backgroundPosition: "85%",
              backgroundRepeat: "no-repeat",
              width:
                // this.state.marginLeft +
                // 2 * this.state.margin +
                // this.state.width * this.state.tileSize,
                this.state.tileSize * this.state.width * 1.5,
              height:
                this.state.margin * 2 + this.state.height * this.state.tileSize
            }}
            className={classes.gameContainer}
          >
            <UIContainer
              width={0.5 * this.state.tileSize * this.state.width - 20}
            >
              <Score val={this.state.score} />
              <Button_Container
                width={0.5 * this.state.tileSize * this.state.width - 20}
              >
                <Button clickHandler={this.hintHandler} top={0}>
                  Hint
                </Button>
                <Button clickHandler={this.resetHandler} bottom={0}>
                  Reset
                </Button>
              </Button_Container>
            </UIContainer>
            <div
              className={classes.tilesContainer}
              style={{
                width: this.state.width * this.state.tileSize + "px",
                height: this.state.height * this.state.tileSize + "px"
              }}
            >
              {checkerboard}
              {gemArray}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Game;
