import './notification.css';
import 'jquery-ui/ui/widgets/tooltip.js';
import angular from 'angular';
import {MessageType} from 'ngeo/message/Message.js';

import ngeoMessageNotification from 'ngeo/message/Notification.js';


/** @type {!angular.IModule} **/
const module = angular.module('app', [
  'gettext',
  ngeoMessageNotification.name,
]);


/**
 * @param {import("ngeo/message/Notification.js").MessageNotification} ngeoNotification Ngeo notification service.
 * @ngInject
 * @constructor
 */
function MainController(ngeoNotification) {

  /**
   * @type {import("ngeo/message/Notification.js").MessageNotification}
   * @export
   */
  this.notification = ngeoNotification;

  /**
   * @type {number}
   * @private
   */
  this.i_ = 1;

  // initialize tooltips
  $('[data-toggle="tooltip"]').tooltip({
    container: 'body',
    trigger: 'hover'
  });

}


/**
 * Demonstrates how to display multiple messages at once with the notification
 * service.
 * @export
 */
MainController.prototype.notifyMulti = function() {
  this.notification.notify([{
    msg: ['Error #', this.i_++].join(''),
    type: MessageType.ERROR
  }, {
    msg: ['Warning #', this.i_++].join(''),
    type: MessageType.WARNING
  }, {
    msg: ['Information #', this.i_++].join(''),
    type: MessageType.INFORMATION
  }, {
    msg: ['Success #', this.i_++].join(''),
    type: MessageType.SUCCESS
  }]);
};


/**
 * Demonstrates how to display a message in an other target than the original
 * one defined by the notification service.
 * @export
 */
MainController.prototype.notifyTarget = function() {
  this.notification.notify({
    msg: 'Error in an other target',
    target: angular.element('#my-messages'),
    type: MessageType.ERROR
  });
};

/**
 * Demonstrates how to display a message for a specific number of seconds.
 * @export
 */
MainController.prototype.notifyQuick = function() {
  this.notification.notify({
    delay: 1000,
    msg: 'Lasts one second',
    type: MessageType.SUCCESS
  });
};


module.controller('MainController', MainController);


export default module;
