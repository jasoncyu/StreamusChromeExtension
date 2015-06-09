﻿define(function(require) {
  'use strict';

  var ClearStreamButton = require('foreground/model/stream/clearStreamButton');
  var SaveStreamButton = require('foreground/model/stream/saveStreamButton');
  var ActiveStreamItemView = require('foreground/view/stream/activeStreamItemView');
  var ClearStreamButtonView = require('foreground/view/stream/clearStreamButtonView');
  var SaveStreamButtonView = require('foreground/view/stream/saveStreamButtonView');
  var StreamItemsView = require('foreground/view/stream/streamItemsView');
  var StreamTemplate = require('text!template/stream/stream.html');

  var StreamView = Marionette.LayoutView.extend({
    id: 'stream',
    className: 'flexColumn',
    template: _.template(StreamTemplate),

    templateHelpers: {
      emptyMessage: chrome.i18n.getMessage('streamEmpty'),
      searchForSongsMessage: chrome.i18n.getMessage('searchForSongs'),
      whyNotAddASongFromAPlaylistOrMessage: chrome.i18n.getMessage('whyNotAddASongFromAPlaylistOr')
    },

    regions: {
      clearStreamButton: '[data-region=clearStreamButton]',
      saveStreamButton: '[data-region=saveStreamButton]',
      activeStreamItem: '[data-region=activeStreamItem]',
      streamItems: '[data-region=streamItems]'
    },

    ui: {
      emptyMessage: '[data-ui~=emptyMessage]',
      showSearchLink: '[data-ui~=showSearchLink]',
      streamDetails: '[data-ui~=streamDetails]'
    },

    events: {
      'click @ui.showSearchLink': '_onClickShowSearchLink'
    },

    modelEvents: {
      'change:activeItem': '_onChangeActiveItem'
    },

    streamItemsEvents: {
      'add:completed': '_onStreamItemsAddCompleted',
      'remove': '_onStreamItemsRemove',
      'reset': '_onStreamItemsReset'
    },

    initialize: function() {
      this.bindEntityEvents(this.model.get('items'), this.streamItemsEvents);
    },

    onRender: function() {
      this._setState(this.model.get('items').isEmpty());
      this._updateStreamDetails(this.model.get('items').getDisplayInfo());

      this.showChildView('streamItems', new StreamItemsView({
        collection: this.model.get('items')
      }));

      this.showChildView('clearStreamButton', new ClearStreamButtonView({
        model: new ClearStreamButton({
          streamItems: this.model.get('items')
        })
      }));

      this.showChildView('saveStreamButton', new SaveStreamButtonView({
        model: new SaveStreamButton({
          streamItems: this.model.get('items'),
          signInManager: StreamusFG.backgroundProperties.signInManager
        })
      }));

      var activeItem = this.model.get('activeItem');
      if (!_.isNull(activeItem)) {
        this._showActiveStreamItem(activeItem, true);
      }
    },

    _onClickShowSearchLink: function() {
      this._showSearch();
    },

    _onChangeActiveItem: function(model, activeItem) {
      if (_.isNull(activeItem)) {
        this.getChildView('activeStreamItem').hide();
      } else {
        // If an active item was already shown then no transition is needed because the view is visible.
        var isInstant = !_.isNull(model.previous('activeItem'));
        this._showActiveStreamItem(activeItem, isInstant);
      }
    },

    _onStreamItemsAddCompleted: function(collection) {
      this._setState(collection.isEmpty());
      this._updateStreamDetails(collection.getDisplayInfo());
    },

    _onStreamItemsRemove: function(model, collection) {
      this._setState(collection.isEmpty());
      this._updateStreamDetails(collection.getDisplayInfo());
    },

    _onStreamItemsReset: function(collection) {
      this._setState(collection.isEmpty());
      this._updateStreamDetails(collection.getDisplayInfo());
    },

    // Hide the empty message if there is anything in the collection
    _setState: function(collectionEmpty) {
      this.ui.emptyMessage.toggleClass('is-hidden', !collectionEmpty);
    },

    _showSearch: function() {
      StreamusFG.channels.search.commands.trigger('show:search');
    },

    _showActiveStreamItem: function(activeStreamItem, instant) {
      this.showChildView('activeStreamItem', new ActiveStreamItemView({
        model: activeStreamItem,
        player: StreamusFG.backgroundProperties.player,
        instant: instant
      }));
    },

    _updateStreamDetails: function(displayInfo) {
      this.ui.streamDetails.text(displayInfo).attr('data-tooltip-text', displayInfo);
    }
  });

  return StreamView;
});