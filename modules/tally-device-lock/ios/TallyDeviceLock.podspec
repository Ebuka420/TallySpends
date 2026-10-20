require 'json'
package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
Pod::Spec.new do |s|
  s.name = 'TallyDeviceLock'
  s.version = package['version']
  s.summary = package['description']
  s.description = package['description']
  s.license = package['license']
  s.author = package['author']
  s.homepage = 'https://github.com/Ebuka420/TallySpends'
  s.source = { :git => 'https://github.com/Ebuka420/TallySpends.git' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'UIKit', 'LocalAuthentication'
  s.source_files = '**/*.swift'
end
