<?php

// This is a compiled Agavi configuration file
// Compiled from: /usr/local/lconf-standalone/app/modules/AppKit/validate/Login/SilentAuth.xml
// Generated by: AgaviValidatorConfigHandler
// Date: 2011-09-02T13:02:13+0000

${'_validator_4e60d3d5e3bd32.59070492'} = new AgaviStringValidator();
${'_validator_4e60d3d5e3bd32.59070492'}->initialize($this->getContext(), array (
  'min' => '1',
  'severity' => 'error',
  'required' => false,
  'class' => 'string',
  'source' => 'headers',
  'name' => '4e60d3d5e3bd32.59070492',
), array (
  0 => 'PHP_AUTH_USER',
), array (
));
${'validationManager'}->addChild(${'_validator_4e60d3d5e3bd32.59070492'});

?>