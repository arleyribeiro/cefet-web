var tutorial = {
    turnedOn: true,

    timer: 0,

    boundEvents: [],

    start: function(deck, el) {
      this.el = el;

      var appearences = localStorage.getItem('bespoke-tutorial-appeared') || 0;
      appearences = window.parseInt(appearences);

      if (appearences < 3) {
        // Listens for changes in the slide
        this.boundEvents.push(deck.on('next', this.deactivate.bind(this)));
        this.boundEvents.push(deck.on('prev', this.deactivate.bind(this)));

        this.timer = window.setTimeout(this.show.bind(this), 3000);
        localStorage.setItem('bespoke-tutorial-appeared', ++appearences);
      }
    },

    deactivate: function() {
      this.turnedOn = false;
      this.el.parentNode.removeChild(this.el);
      window.clearTimeout(this.timer);
      for (var i = 0; i < this.boundEvents.length; i++) {
        this.boundEvents[i]();
      }
    },

    show: function() {
      this.el.classList.add('tutorial-on');
    }
  };

module.exports = function(tutorialEl) {
  return function(deck) {
    tutorial.start(deck, tutorialEl);
  };
};
