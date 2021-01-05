'use strict'


import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { FormGroup, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import _ from 'lodash'

class ControlPanelComboBox extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleControlChange: PropTypes.func,
    i18n: PropTypes.func,
  };

  static getDerivedStateFromProps(props, state) {
    const { control, handleControlChange } = props
    const handleComboChange = selectedItem => {
      control.active = selectedItem
      handleControlChange()
    }
    const { active } = control
    const { currentSelection } = state
    let {
      isOpen,
      searchText
    } = state

    /////////////////////////////////////////////////////////////
    // search mode
    if (searchText && searchText.length) {
      // nothing selected, filter list
      if (currentSelection === undefined) {
        if (active !== searchText) {
          handleComboChange(searchText)
        }
      } else {
        // handle change
        handleComboChange(currentSelection)
        isOpen = false
        searchText = null
      }
    } else if (currentSelection !== undefined) {
      // handle change
      handleComboChange(currentSelection)
      searchText = null
      isOpen = false
    }
    return {
      active,
      currentSelection: undefined,
      isOpen,
      searchText
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      isOpen: false,
      searchText: null
    }
    this.onDocClick = (event) => {
      const clickedOnToggle = this.parentRef && this.parentRef.contains(event.target)
      const clickedWithinMenu = this.menuRef && this.menuRef.contains && this.menuRef.contains(event.target)
      if (this.state.isOpen && !(clickedOnToggle || clickedWithinMenu)) {
        this.setState({isOpen: false})
      }
    }
  }
  componentDidMount() {
    document.addEventListener('mousedown', this.onDocClick)
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.onDocClick)
  }

  setParentRef = (ref) => {
    this.parentRef = ref
  };

  setMenuRef = (ref) => {
    this.menuRef = ref
  };

  render() {
    const {
      isOpen,
      searchText,
    } = this.state
    const { controlId, i18n, control } = this.props
    const {
      name,
      userData = [],
      availableMap,
      exception,
      validation={},
      hasReplacements,
      isFailed,
      fetchAvailable,
      tooltip
    } = control
    let { isLoading } = control
    let { active, available=[], placeholder = '' } = control
    let loadingMsg
    if (fetchAvailable) {
      if (isLoading) {
        loadingMsg = i18n(
          _.get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        placeholder = i18n('resource.error')
      } else if (available.length === 0) {
        placeholder =
          placeholder ||
          i18n(
            _.get(control, 'fetchAvailable.emptyDesc', 'resource.empty'))
      }
    } else if (isLoading) {
      loadingMsg = i18n(
        'creation.loading.values',
        [name.toLowerCase()]
      )
    }
    if (!placeholder) {
      placeholder = i18n(
        'creation.enter.value',
        [name.toLowerCase()]
      )
    }
    available = _.uniq([...userData, ...available])

    // when available map has descriptions of choices
    // ex: instance types have # cpu's etc
    if (availableMap && !hasReplacements) {
      const map = _.invert(availableMap)
      active = map[active] || active
    }

    // if active was preset by loading an existing resource
    // initialize combobox to that value
    if (active && available.length === 0) {
      available.push(active)
      if (isLoading) {
        available.push(loadingMsg)
      } else if (isFailed) {
        available.push(placeholder)
      }
      isLoading = false
    }

    let currentAvailable = available
    if (!isLoading && searchText && searchText.length) {
      const findText = searchText.toLowerCase()
      currentAvailable = available.filter(item => {
        return item.toLowerCase().includes(findText)
      })
      if (currentAvailable.length===0) {
        currentAvailable = available
      }
    }
    const items = currentAvailable.map((label, inx) => {
      return { label, id: inx }
    })
    //const initialSelectedItem = items.find(item => item.label === active)
    const key = `${controlId}-${name}-${active}`
    const toggleClasses = classNames({
      'tf--list-box__menu-icon': true,
      'tf--list-box__menu-icon--open': isOpen
    })
    const aria = isOpen ? 'Close menu' : 'Open menu'
    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div className="creation-view-controls-treeselect">
          <FormGroup
            id={`${controlId}-label`}
            label={name}
            isRequired={validation.required}
            fieldId={controlId}
            helperTextInvalid={exception}
            validated={validated}
            labelIcon={
              /* istanbul ignore next */
              tooltip ? (
                <Popover
                  id={`${controlId}-label-help-popover`}
                  bodyContent={tooltip}
                >
                  <button
                    id={`${controlId}-label-help-button`}
                    aria-label="More info"
                    onClick={(e) => e.preventDefault()}
                    className="pf-c-form__group-label-help"
                  >
                    <HelpIcon noVerticalAlign />
                  </button>
                </Popover>
              ) : (
                <React.Fragment />
              )
            }
          >
            <div id={controlId}>
              <div
                role="listbox"
                aria-label="Choose an item"
                tabIndex="0"
                className="tf--list-box"
              >
                <div
                  role="button"
                  className=""
                  tabIndex="0"
                  type="button"
                  aria-label={aria}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  data-toggle="true"
                  onClick={this.clickToggle.bind(this)}
                  onKeyPress={this.pressToggle.bind(this)}
                >
                  <input
                    className="pf-c-form-control"
                    aria-label="ListBox input field"
                    spellCheck="false"
                    role="combobox"
                    aria-controls={key}
                    aria-autocomplete="list"
                    aria-expanded="true"
                    autoComplete="new-password"
                    id="downshift-0-input"
                    placeholder=""
                    ref={this.setParentRef}
                    style={validated === 'error' ? {borderBottomColor: 'red'} : undefined}
                    value={searchText !== null ? searchText : active}
                    onKeyUp={this.pressUp.bind(this)}
                    onKeyDown={this.pressDown.bind(this)}
                    onChange={evt =>
                      this.setState({ searchText: evt.currentTarget.value })
                    }
                  />
                  <div
                    role="button"
                    className="tf--list-box__selection"
                    tabIndex="0"
                    title="Clear selected item"
                    onClick={this.clickClear.bind(this)}
                    onKeyPress={this.pressClear.bind(this)}
                  >
                    <svg
                      height="10"
                      role="img"
                      viewBox="0 0 10 10"
                      width="10"
                      focusable="false"
                      aria-label="Clear selected item"
                      alt="Clear selected item"
                    >
                      <title>Clear selected item</title>
                      <path d="M6.32 5L10 8.68 8.68 10 5 6.32 1.32 10 0 8.68 3.68 5 0 1.32 1.32 0 5 3.68 8.68 0 10 1.32 6.32 5z" />
                    </svg>
                  </div>
                  <div
                    role="button"
                    tabIndex="0"
                    className={toggleClasses}
                    onClick={this.clickToggle.bind(this)}
                    onKeyPress={this.pressToggle.bind(this)}
                  >
                    <svg
                      fillRule="evenodd"
                      height="5"
                      role="img"
                      viewBox="0 0 10 5"
                      width="10"
                      alt={aria}
                      aria-label={aria}
                    >
                      <title>Close menu</title>
                      <path d="M0 0l5 4.998L10 0z" />
                    </svg>
                  </div>
                </div>
                {isOpen && (
                  <div className="tf--list-box__menu" key={key} id={key} ref={this.setMenuRef} >
                    {items.map(
                      ({ label, id }) => {
                        const itemClasses = classNames({
                          'tf--list-box__menu-item': true,
                          searching: searchText,
                        })
                        return (
                          <div
                            role="button"
                            key={label}
                            className={itemClasses}
                            id={`downshift-0-item-${id}`}
                            tabIndex="0"
                            onClick={this.clickSelect.bind(this, label)}
                            onKeyPress={this.pressSelect.bind(this, label)}
                          >
                            {this.renderLabel(label, searchText)}
                          </div>
                        )
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          </FormGroup>
        </div>
      </React.Fragment>
    )
  }

  renderLabel(label, searchText) {
    const inx =
      searchText &&
      searchText.length &&
      label.toLowerCase().indexOf(searchText.toLowerCase())
    if (inx !== null && inx >= 0) {
      label = [
        label.substr(0, inx),
        label.substr(inx, searchText.length),
        label.substr(inx + searchText.length)
      ]
      return (
        <React.Fragment>
          {label[0]}
          <b>{label[1]}</b>
          {label[2]}
        </React.Fragment>
      )
    } else {
      return <React.Fragment>{label}</React.Fragment>
    }
  }

  pressUp(e) {
    if (e.key === 'Enter' && this.state.searchText) {
      const { searchText } = this.state
      const { control, handleControlChange } = this.props
      control.userData = control.userData || []
      control.userData.push(searchText)
      control.active = searchText
      handleControlChange()
      this.setState({
        currentSelection: undefined,
        isOpen:false,
        searchText: null
      })
    }
  }

  pressDown(e) {
    if (e.key === 'Escape') {
      this.clickClear()
    }
  }

  pressToggle(e) {
    if (e.key === 'Enter') {
      this.clickToggle()
    } else if (e.key === 'Escape') {
      this.clickClear()
    }
  }

  clickToggle(e) {
    if (e) {
      e.stopPropagation()
    }
    if (!this.state.searchText) {
      this.setState(preState => {
        let {
          currentAvailable,
          currentSelection,
          searchText,
          isOpen
        } = preState
        isOpen = !isOpen
        if (!isOpen) {
          currentAvailable = []
          currentSelection = undefined
          searchText = null
        }
        return {
          currentAvailable,
          currentSelection,
          searchText,
          isOpen
        }
      })
    }
  }

  pressSelect(label, e) {
    if (e.key === 'Enter') {
      this.clickSelect(label)
    }
  }

  clickSelect(label) {
    this.setState({ currentSelection: label })
  }

  pressClear(inx, e) {
    if (e && e.key === 'Enter') {
      this.clickClear()
    }
  }

  clickClear() {
    this.setState({ searchText: '' })
  }
}

export default ControlPanelComboBox
