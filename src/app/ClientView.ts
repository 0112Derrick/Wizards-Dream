import { HTML_IDS as $id } from "../constants/HTMLElementIds.js";
import $ClientSyntheticEventEmitter from "../framework/ClientSyntheticEventEmitter.js";
import { EventConstants as $events } from "../constants/EventConstants.js";
import { CharacterCreationDataInterface as $characterSignup } from "../game-server/interfaces/CharacterDataInterface.js";
import { resolve } from "path";
import { MapNames as $MapNames } from "../constants/MapNames.js";
import {
  CharacterSize as $CharacterSize,
  CharacterVelocity as $CharacterVelocity,
} from "../constants/CharacterAttributesConstants.js";
import { Direction } from "./DirectionInput.js";

class MissingElementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Missing Html Element";
  }
}

class ClientView extends $ClientSyntheticEventEmitter {
  private DOM: HTMLElement[] = [];
  private characterMenuStatus = false;
  private loadingScreenToggle = false;

  constructor() {
    super();
    for (let elem_id in $id) {
      let elem = document.getElementById($id[elem_id]);
      if (elem) {
        this.DOM[$id[elem_id]] = elem;
      } else {
        throw new MissingElementError(`Element id: ${$id}: ${$id[elem_id]} .`);
      }
    }
    this.DOM[$id.LOGOUT].addEventListener("click", () => {
      this.logoutAccountCallback();
    });

    // this.DOM[$id.STOP_LOOP].addEventListener('click', () => {
    //     this.dispatchEventLocal($events.STOP_GAME_LOOP, null);
    // });

    this.DOM[$id.SELECT_SERVER].addEventListener("click", () => {
      this.selectServerCallback();
    });

    this.DOM[$id.CLOSE_SERVER_MODAL].addEventListener("click", () =>
      this.closeServerModal()
    );

    window.addEventListener("click", (e) => {
      if (e.target === this.DOM[$id.SERVER_SELECTION_MODAL]) {
        this.closeServerModal();
      }
    });

    this.DOM[$id.GAME_CHAT_FORM].addEventListener("submit", (event) => {
      event.preventDefault();
      this.sendMessage();
    });

    // this.DOM[$id.START_LOOP].addEventListener('click', () => {
    //     this.dispatchEventLocal($events.START_GAME_LOOP, null);
    // })
    let lockscreen = false;
    (this.DOM[$id.LOCKSCREEN] as HTMLElement).style.outline = "none";
    (this.DOM[$id.LOCKSCREEN] as HTMLElement).style.background = "green";
    (this.DOM[$id.LOCKSCREEN] as HTMLElement).innerText = "Lock Screen";

    this.DOM[$id.LOCKSCREEN].addEventListener("click", () => {
      lockscreen = !lockscreen;
      if (lockscreen) {
        document.body.style.overflowY = "hidden";
        (this.DOM[$id.LOCKSCREEN] as HTMLElement).style.background = "red";
        (this.DOM[$id.LOCKSCREEN] as HTMLElement).innerText = "Unlock Screen";
      } else {
        document.body.style.overflowY = "auto";
        (this.DOM[$id.LOCKSCREEN] as HTMLElement).style.background = "green";
        (this.DOM[$id.LOCKSCREEN] as HTMLElement).innerText = "Lock Screen";
      }

      console.log(lockscreen);
    });

    this.DOM[$id.CHARACTER_CREATE_FORM].addEventListener("submit", (event) => {
      event.preventDefault();
      this.characterCreateCallback();
    });

    document.getElementById("logout")!.addEventListener("click", () => {
      this.logoutAccountCallback();
    });

    //document.getElementById(this.DOM[$id.CHARACTER_MODAL_BTN]).addEventListener('click', () => {
    this.DOM[$id.CHARACTER_MODAL_BTN].addEventListener("click", () => {
      if (!this.characterMenuStatus) {
        // document.querySelector<HTMLElement>(this.DOM[$id.CHARACTER_MODAL_BTN])!.style.display = 'block';
        this.DOM[$id.CHARACTER_CREATE_MODAL]!.style.display = "block";
        this.characterMenuStatus = true;
      } else {
        this.DOM[$id.CHARACTER_CREATE_MODAL]!.style.display = "none";
        // document.querySelector<HTMLElement>(this.DOM[$id.CHARACTER_MODAL_BTN])!.style.display = 'none';
        this.characterMenuStatus = false;
      }
    });
  }

  //createButton takes in an object with the attributes name, id, innerHtml / & html element to append to.
  createButton(data, appendLocation): void {
    if (document.getElementById(data.index)) {
      return;
    }
    let button = document.createElement("button");
    console.log(data);
    button.setAttribute("type", "button");
    button.innerHTML = `${data.innerHtml}: ${data.name}`;
    button.setAttribute("id", data.id);

    appendLocation.appendChild(button);
  }

  selectServerCallback() {
    this.DOM[$id.SERVER_SELECTION_MODAL].style.display = "block";
    this.dispatchEventLocal($events.REQUEST_SERVER_ROOMS, null);
  }

  closeServerModal() {
    this.DOM[$id.SERVER_SELECTION_MODAL].style.display = "none";
  }

  createServerSelectionButtons(serverRooms: Array<string>) {
    this.deleteServerButtons();
    serverRooms.forEach((serverRoom) => {
      let serverRoomData = {
        name: serverRoom.at(0),
        id: serverRoom.at(0),
        innerHtml: "Server",
      };

      this.createButton(
        serverRoomData,
        this.DOM[$id.SERVER_SELECTION_BUTTONS_CONTAINER]
      );
    });
    /* for (let serverRoom of serverRooms) {
        } */

    this.serverButtons(serverRooms);
  }

  deleteServerButtons() {
    this.DOM[$id.SERVER_SELECTION_BUTTONS_CONTAINER].innerHTML = "";
  }

  toggleLoadingScreen(): void {
    if (this.loadingScreenToggle) {
      this.DOM[$id.LOADING_SCREEN].style.display = "none";
      this.loadingScreenToggle = false;
      console.log("loading screen closing");
    } else {
      this.DOM[$id.LOADING_SCREEN].style.display = "block";
      this.loadingScreenToggle = true;
      console.log("loading screen open");
    }
  }

  serverButtons(serverRooms: Array<string>) {
    serverRooms.forEach((serverRoom) => {
      document
        .getElementById(serverRoom.at(0))
        .addEventListener("click", () => {
          this.dispatchEventLocal($events.SELECT_SERVER, serverRoom.at(1));
        });
    });
    /* for (let serverRoom of serverRooms) {
      } */
  }

  async createCharacterSelectionButtons(characters: Array<any>) {
    this.clearButtons();
    characters.forEach((character, i) => {
      let data = {
        name: character.username,
        index: i,
      };
      this.createCharacterSelectButton(data);
    });
    this.characterButtons(characters.length);
  }

  characterButtons(numOfCharacter: number) {
    let button: number;
    for (let i = 0; i < numOfCharacter; i++) {
      document
        .getElementById("character+" + i)
        .addEventListener("click", () => {
          button = i;
          this.dispatchEventLocal($events.SELECT_CHARACTER, button);
        });
    }
  }

  createCharacterSelectButton(data): void {
    if (document.getElementById(data.index)) {
      return;
    }

    let button = document.createElement("button");
    console.log(data);
    button.setAttribute("type", "button");
    button.innerHTML = "Char: " + data.name;
    button.setAttribute("id", "character+" + data.index);

    document.getElementById(
      this.DOM[$id.SELECT_CHARACTERS].appendChild(button)
    );
  }

  clearButtons(): void {
    this.DOM[$id.SELECT_CHARACTERS].innerHTML = "";
  }

  sendMessage() {
    let message: string = (<HTMLInputElement>this.DOM[$id.GAME_CHAT_INPUT])
      .value;
    this.dispatchEventLocal($events.MESSAGE, message);
    this.resetMessageForm();
  }

  postMessage(message, username) {
    let li: HTMLLIElement = document.createElement("li");
    li.innerHTML = username + ": " + message;
    <HTMLUListElement>this.DOM[$id.GAME_CHAT_UL].appendChild(li);
    this.updateScroll(this.DOM[$id.GAME_CHAT_UL]);
  }

  updateScroll(chat) {
    chat.scrollTop = chat.scrollHeight;
  }

  resetMessageForm() {
    <HTMLFormElement>this.DOM[$id.GAME_CHAT_FORM].reset();
    <HTMLInputElement>this.DOM[$id.GAME_CHAT_INPUT].blur();
  }

  characterCreateCallback() {
    let png = null;
    if ((<HTMLInputElement>this.DOM[$id.CHARACTER_NAME]).value == "male") {
      png = "/images/characters/players/erio.png";
    } else {
      png = "/images/characters/players/erio.png";
    }
    let formData: $characterSignup = {
      username: (<HTMLInputElement>this.DOM[$id.CHARACTER_NAME]).value,
      characterGender: (<HTMLInputElement>(
        document.querySelector('input[name="character-gender"]:checked')
      )).value,
      player: "",
      x: 0,
      y: 0,
      sprite: png,
      direction: Direction.RIGHT,
      width: $CharacterSize.width,
      height: $CharacterSize.height,
      location: $MapNames.GrassyField,
      xVelocity: $CharacterVelocity.xVelocity,
      yVelocity: $CharacterVelocity.yVelocity,
      gameObjectID: 0,
      name: (<HTMLInputElement>this.DOM[$id.CHARACTER_NAME]).value,
    };

    console.log("Got new player account submission", formData);

    if (formData.username) {
      console.log("Submitting character creation form", formData);
      this.dispatchEventLocal($events.CHARACTER_CREATE, formData);
    } else {
      alert("Please fill out all information correctly");
      this.resetSignupForm();
    }
  }

  resetSignupForm() {
    <HTMLFormElement>this.DOM[$id.CHARACTER_CREATE_FORM].reset();
  }

  logoutAccountCallback() {
    this.dispatchEventLocal($events.LOGOUT, null);
  }
}
export let View = new ClientView();
